//~~~~~~~~~~backend API code~~~~~~~~~~~~//

const express = require("express");
const cors = require("cors");
const sql = require("mysql2");
const bcrypt = require("bcrypt");
const uuid = require("uuid").v4;
const config = require("./config");
const { createSessionMiddleware } = require("./session");
const { createUpload, resolveStoredFilePath } = require("./storage");

const BCRYPT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const RESERVED_USERNAMES = new Set([
    "home", "create", "profile", "search", "comments",
    "notifications", "signup", "success", "login", "logout", "api",
]);

function requireAuth(req, res, next) {
    if (!req.session.username) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

function normalizeCredentials({ email, username, password }) {
    return {
        email: typeof email === "string" ? email.trim().toLowerCase() : "",
        username: typeof username === "string" ? username.trim() : "",
        password: typeof password === "string" ? password : "",
    };
}

async function startServer() {
    const app = express();
    const upload = createUpload();

    app.set("trust proxy", 1);
    app.use(cors({
        origin: config.corsOrigins,
        methods: ["POST", "GET"],
        credentials: true,
    }));
    app.use(express.urlencoded({ extended: true }));
    app.use(await createSessionMiddleware());
    app.use(express.json({ limit: "1mb" }));
    app.use(express.static("assets"));

    const connection = sql.createConnection({
        host: config.mysql.host,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
    });

    connection.query(`
        CREATE TABLE IF NOT EXISTS accounts (
            username VARCHAR(255),
            password VARCHAR(255),
            email VARCHAR(255)
        );
    `);
    connection.query(`ALTER TABLE accounts MODIFY password VARCHAR(255)`);
    connection.query(`ALTER TABLE accounts MODIFY username VARCHAR(255) NOT NULL`);
    connection.query(`ALTER TABLE accounts MODIFY email VARCHAR(255) NOT NULL`);
    connection.query(`CREATE UNIQUE INDEX accounts_username_unique ON accounts (username)`, () => {});
    connection.query(`CREATE UNIQUE INDEX accounts_email_unique ON accounts (email)`, () => {});

    connection.query(`
        CREATE TABLE IF NOT EXISTS user_posts (
            users VARCHAR(255),
            files VARCHAR(255),
            captions TEXT,
            likes INT,
            dates VARCHAR(255),
            post_ids VARCHAR(255)
        );
    `);
    // Allow full S3 URLs in files column
    connection.query(`ALTER TABLE user_posts MODIFY files TEXT`);

    connection.query(`
        CREATE TABLE IF NOT EXISTS comment_section (
            commenters VARCHAR(255),
            comments TEXT,
            dates VARCHAR(255),
            post_ids VARCHAR(255)
        );
    `);

    connection.query(`
        CREATE TABLE IF NOT EXISTS like_table (
            owners VARCHAR(255),
            post_ids VARCHAR(255),
            likers VARCHAR(255)
        );
    `);

    connection.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            users VARCHAR(255),
            notifications TEXT
        );
    `);

    app.get("/health", (req, res) => {
        return res.json({
            ok: true,
            env: config.nodeEnv,
            sessions: config.redisUrl ? "redis" : "memory",
            uploads: config.s3.enabled ? "s3" : "local",
        });
    });

    app.post("/signup", async (req, res) => {
        const { email, username, password } = normalizeCredentials(req.body);

        if (!EMAIL_REGEX.test(email) || !USERNAME_REGEX.test(username) || password.length < 8) {
            return res.status(400).json({ valid: false, error: "Invalid email, username, or password" });
        }
        if (RESERVED_USERNAMES.has(username.toLowerCase())) {
            return res.status(400).json({ valid: false, error: "Username is reserved" });
        }

        connection.query(
            "SELECT email, username FROM accounts WHERE email = ? OR username = ?",
            [email, username],
            async (error, results) => {
                if (error) {
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                if (results.length > 0) {
                    return res.json({ valid: false });
                }

                try {
                    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
                    connection.query(
                        "INSERT INTO accounts (email, username, password) VALUES (?, ?, ?)",
                        [email, username, passwordHash],
                        (err) => {
                            if (err) {
                                if (err.code === "ER_DUP_ENTRY") {
                                    return res.json({ valid: false });
                                }
                                return res.status(500).json({ error: "Internal Server Error" });
                            }
                            return res.json({ valid: true });
                        }
                    );
                } catch (hashError) {
                    return res.status(500).json({ error: "Internal Server Error" });
                }
            }
        );
    });

    app.post("/login", (req, res) => {
        const { email, password } = normalizeCredentials(req.body);

        if (!email || !password) {
            return res.json({ valid: false });
        }

        connection.query(
            "SELECT username, email, password FROM accounts WHERE email = ?",
            [email],
            async (error, results) => {
                if (error) {
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                if (results.length === 0) {
                    return res.json({ valid: false });
                }

                try {
                    const match = await bcrypt.compare(password, results[0].password);
                    if (!match) {
                        return res.json({ valid: false });
                    }
                    req.session.regenerate((regenErr) => {
                        if (regenErr) {
                            return res.status(500).json({ error: "Internal Server Error" });
                        }
                        req.session.email = results[0].email;
                        req.session.username = results[0].username;
                        return res.json({ valid: true });
                    });
                } catch (compareError) {
                    return res.status(500).json({ error: "Internal Server Error" });
                }
            }
        );
    });

    app.get("/getinfo", (req, res) => {
        if (!req.session.username) {
            return res.json({ user: null, email: null });
        }
        return res.json({ user: req.session.username, email: req.session.email });
    });

    app.post("/logout", (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: "Internal Server Error" });
            }
            res.clearCookie("connect.sid");
            return res.json({ valid: true });
        });
    });

    app.post("/upload", requireAuth, (req, res) => {
        upload.single("file")(req, res, async (uploadError) => {
            if (uploadError) {
                return res.status(400).json({ error: uploadError.message || "Upload failed" });
            }
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            try {
                const user = req.session.username;
                const filePath = await resolveStoredFilePath(req.file, upload);
                const caption = typeof req.body.caption === "string" ? req.body.caption : "";
                const date = new Date().toISOString().slice(0, 10);
                const id = uuid();

                connection.query(
                    "INSERT INTO user_posts (users, files, captions, likes, dates, post_ids) VALUES (?,?,?,?,?,?)",
                    [user, filePath, caption, 0, date, id],
                    (error) => {
                        if (error) {
                            return res.status(500).json({ error: "Internal Server Error" });
                        }
                        return res.json({ valid: true });
                    }
                );
            } catch (saveError) {
                console.error("Upload save failed:", saveError);
                return res.status(500).json({ error: "Upload failed" });
            }
        });
    });

    app.get("/getfeeds", requireAuth, (req, res) => {
        connection.query(
            "SELECT users, files, captions, likes, dates, post_ids FROM user_posts",
            (error, results) => {
                if (error) {
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                const feed = (results || []).map((post) => [
                    post.users,
                    post.files,
                    post.captions,
                    post.likes,
                    post.dates,
                    post.post_ids,
                ]);
                return res.json(feed);
            }
        );
    });

    app.post("/viewpost", requireAuth, (req, res) => {
        if (!req.body.user || !req.body.id) {
            return res.status(400).json({ error: "Missing post reference" });
        }
        req.session.viewuser = req.body.user;
        req.session.viewpost = req.body.id;
        return res.json({ valid: true });
    });

    app.get("/getpost", requireAuth, (req, res) => {
        if (!req.session.viewuser || !req.session.viewpost) {
            return res.status(404).json({ error: "Post not found" });
        }
        connection.query(
            "SELECT users, files, captions, dates FROM user_posts WHERE users = ? AND post_ids = ?",
            [req.session.viewuser, req.session.viewpost],
            (error, results) => {
                if (error) {
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                if (!results || results.length === 0) {
                    return res.status(404).json({ error: "Post not found" });
                }
                return res.json({
                    user: results[0].users,
                    file: results[0].files,
                    caption: results[0].captions,
                    date: results[0].dates,
                });
            }
        );
    });

    app.post("/addcomment", requireAuth, (req, res) => {
        const commenter = req.session.username;
        const owner = req.session.viewuser;
        const post = req.session.viewpost;
        const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
        const date = new Date().toISOString().slice(0, 10);

        if (!owner || !post || !comment) {
            return res.status(400).json({ error: "Invalid comment" });
        }

        connection.query(
            "INSERT INTO comment_section (post_ids, commenters, comments, dates) VALUES (?,?,?,?)",
            [post, commenter, comment, date],
            (error) => {
                if (error) {
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                connection.query(
                    "INSERT INTO notifications (users, notifications) VALUES (?,?)",
                    [owner, commenter + " commented on your post: " + post]
                );
                return res.json({ date: date, commenter: commenter });
            }
        );
    });

    app.get("/getcomments", requireAuth, (req, res) => {
        if (!req.session.viewpost) {
            return res.json([]);
        }
        connection.query(
            "SELECT commenters, comments, dates FROM comment_section WHERE post_ids = ?",
            [req.session.viewpost],
            (error, results) => {
                if (error) {
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                const comment_data = (results || []).map((comment) => [
                    comment.commenters,
                    comment.comments,
                    comment.dates,
                ]);
                return res.json(comment_data);
            }
        );
    });

    app.post("/likepost", requireAuth, (req, res) => {
        const liker = req.session.username;
        const owner = req.body.user;
        const id = req.body.id;

        if (!owner || !id) {
            return res.status(400).json({ error: "Missing post reference" });
        }

        connection.query(
            "SELECT * FROM like_table WHERE likers = ? AND post_ids = ?",
            [liker, id],
            (error, results) => {
                if (error) {
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                if (results.length > 0) {
                    connection.query("DELETE FROM like_table WHERE likers = ? AND post_ids = ?", [liker, id]);
                    connection.query("UPDATE user_posts SET likes = likes - 1 WHERE post_ids = ?", [id]);
                    return res.json({ valid: false });
                }

                connection.query("INSERT INTO like_table (owners, post_ids, likers) VALUES (?,?,?)", [owner, id, liker]);
                connection.query(
                    "INSERT INTO notifications (users, notifications) VALUES (?,?)",
                    [owner, liker + " liked your post: " + id]
                );
                connection.query(
                    "UPDATE user_posts SET likes = likes + 1 WHERE users = ? AND post_ids = ?",
                    [owner, id]
                );
                return res.json({ valid: true });
            }
        );
    });

    app.get("/getnotifications", requireAuth, (req, res) => {
        const user = req.session.username;
        connection.query("SELECT notifications FROM notifications WHERE users = ?", [user], (error, results) => {
            if (error) {
                return res.status(500).json({ error: "Internal Server Error" });
            }
            const notifications = (results || []).map((row) => row.notifications);
            return res.json(notifications);
        });
    });

    app.post("/clearnotifications", requireAuth, (req, res) => {
        const user = req.session.username;
        connection.query("DELETE FROM notifications WHERE users = ?", [user], (error) => {
            if (error) {
                return res.status(500).json({ error: "Internal Server Error" });
            }
            return res.json({ valid: true });
        });
    });

    app.post("/searchusers", requireAuth, (req, res) => {
        const rawSearch = typeof req.body.search === "string" ? req.body.search.trim() : "";
        const search = rawSearch + "%";
        connection.query("SELECT username FROM accounts WHERE username LIKE ?", [search], (error, results) => {
            if (error) {
                return res.status(500).json({ error: "Internal Server Error" });
            }
            const usernames = (results || []).map((user) => user.username);
            req.session.searchresults = usernames;
            return res.json(req.session.searchresults);
        });
    });

    app.get("/getuserdata", requireAuth, (req, res) => {
        const username = req.session.username;
        connection.query("SELECT files, post_ids FROM user_posts WHERE users = ?", [username], (error, results) => {
            if (error) {
                return res.status(500).json({ error: "Internal Server Error" });
            }
            const user_posts = (results || []).map((post) => [post.files, post.post_ids]);
            return res.json({ user: username, posts: user_posts });
        });
    });

    app.post("/viewprofile", requireAuth, (req, res) => {
        const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
        if (!username) {
            return res.status(400).json({ error: "Missing username" });
        }
        connection.query("SELECT files, post_ids FROM user_posts WHERE users = ?", [username], (error, results) => {
            if (error) {
                return res.status(500).json({ error: "Internal Server Error" });
            }
            const user_posts = (results || []).map((post) => [post.files, post.post_ids]);
            return res.json({ user: username, posts: user_posts });
        });
    });

    app.get("/getsearchresults", requireAuth, (req, res) => {
        return res.json(req.session.searchresults || []);
    });

    app.listen(config.port, "0.0.0.0", () => {
        console.log(`Running on port ${config.port}`);
        console.log(`Uploads: ${config.s3.enabled ? "S3" : "local assets/"}`);
        console.log(`Sessions: ${config.redisUrl ? "Redis" : "memory"}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
