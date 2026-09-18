//~~~~~~~~~~backend API code~~~~~~~~~~~~//

//library imports
require("dotenv").config();
const express = require("express")
const cors = require("cors")
const session = require("express-session")
const sql = require("mysql2");
const multer = require("multer");
const bcrypt = require("bcrypt");
const uuid = require('uuid').v4;
const app = express();

const BCRYPT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

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

//middleware
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], methods: ["POST", "GET"], credentials: true }))
app.use(express.urlencoded({ extended: true }))
app.use(session({
        secret: process.env.SESSION_SECRET || "change-me-in-production",
        resave: false,
        saveUninitialized: false,
        cookie: {
                httpOnly: true,
                sameSite: "lax",
                secure: false,
                maxAge: 1000 * 60 * 60 * 24 * 7,
        },
}))
app.use(express.json({ limit: "1mb" }))
app.use(express.static("assets"));

//allows uploaded files to be stored in assets folder
const storage = multer.diskStorage({
        destination: function (req, file, cb) {return cb(null, "assets")}, 
        filename: function (req, file, cb) {return cb(null, `${Date.now()}-${uuid()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`)}
})
const upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
})

//database connection
const connection = sql.createConnection({
        host: "localhost", 
        user: "root", 
        password: "", 
        database: "storage"
})

//creates necessary tables
connection.query(`
    CREATE TABLE IF NOT EXISTS accounts (
        username VARCHAR(255),
        password VARCHAR(255),
        email VARCHAR(255)
    );
`);
// bcrypt hashes need enough room if an older schema used a short column
connection.query(`ALTER TABLE accounts MODIFY password VARCHAR(255)`);
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

//endpoint for storing credentials in database
app.post('/signup', async (req, res) => {
        const { email, username, password } = normalizeCredentials(req.body);

        if (!EMAIL_REGEX.test(email) || !USERNAME_REGEX.test(username) || password.length < 8) {
                return res.status(400).json({ valid: false, error: "Invalid email, username, or password" });
        }

        connection.query("SELECT email, username FROM accounts WHERE email = ? OR username = ?", [email, username], async (error, results) => {
                if (error) {
                        return res.status(500).json({ error: 'Internal Server Error' });
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
                                                return res.status(500).json({ error: 'Internal Server Error' });
                                        }
                                        res.json({ valid: true });
                                }
                        );
                } catch (hashError) {
                        return res.status(500).json({ error: 'Internal Server Error' });
                }
        });
});

//endpoint for checking if credentials exist in database
app.post('/login', (req, res) => {
        const { email, password } = normalizeCredentials(req.body);

        if (!email || !password) {
                return res.json({ valid: false });
        }

        connection.query("SELECT username, email, password FROM accounts WHERE email = ?", [email], async (error, results) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
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
                                        return res.status(500).json({ error: 'Internal Server Error' });
                                }
                                req.session.email = results[0].email;
                                req.session.username = results[0].username;
                                res.json({ valid: true });
                        });
                } catch (compareError) {
                        return res.status(500).json({ error: 'Internal Server Error' });
                }
        });
});

//endpoint for receiving information for current user
app.get('/getinfo', (req, res) => {
        if (!req.session.username) {
                return res.json({ user: null, email: null });
        }
        res.json({ user: req.session.username, email: req.session.email })
})
//endpoint for destroying the current session
app.post('/logout', (req, res) => {
        req.session.destroy((err) => {
                if (err) {
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                }
                res.clearCookie('connect.sid');
                res.json({ valid: true });
        });
})

//endpoint for uploading a post
app.post('/upload', requireAuth, upload.single('file'), (req, res) => {
        if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
        }
        const user = req.session.username;
        const path = req.file.path;
        const caption = req.body.caption;
        const date = new Date().toISOString().slice(0, 10);
        const id = uuid();
        connection.query("INSERT INTO user_posts (users, files, captions, likes, dates, post_ids) VALUES (?,?,?,?,?,?)", [user, path, caption, 0, date, id], (error) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                res.json({ valid: true })
        });
})

//endpoint for receiving all feed data that exists in database
app.get("/getfeeds", requireAuth, (req, res) => {
        let feed = [];
        connection.query("SELECT users, files, captions, likes, dates, post_ids FROM user_posts", (error, results) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                if (results) {
                        feed = results.map(post => [post.users, post.files, post.captions, post.likes, post.dates, post.post_ids]);
                }
                res.json(feed);
        })
})

//endpoint for setting session variables related to the post the user is currently viewing
app.post("/viewpost", requireAuth, (req, res) => {
        req.session.viewuser = req.body.user;
        req.session.viewpost = req.body.id;
        res.json({ valid: true });
})

//endpoint for receiving data for a specific post
app.get("/getpost", requireAuth, (req, res) => {
        connection.query("SELECT * FROM user_posts WHERE users = ? AND post_ids = ?", [req.session.viewuser, req.session.viewpost], (error, results) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                res.json({ user: results[0].users, file: results[0].files, caption: results[0].captions, date: results[0].dates })
        })
})

//endpoint to add a comment
app.post("/addcomment", requireAuth, (req, res) => {
        const commenter = req.session.username;
        const owner = req.session.viewuser;
        const post = req.session.viewpost;
        const comment = req.body.comment;
        const date = new Date().toISOString().slice(0, 10);
        connection.query("INSERT INTO comment_section (post_ids, commenters, comments, dates) VALUES (?,?,?,?)", [post, commenter, comment, date], (error) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                connection.query("INSERT INTO notifications (users, notifications) VALUES (?,?)", [owner, commenter + " commented on your post: "+post]);
                res.json({ date: date, commenter: commenter })
        });
})

//endpoint to receive all comment data for a specific post
app.get("/getcomments", requireAuth, (req, res) => {
        connection.query("SELECT * FROM comment_section WHERE post_ids = ?", [req.session.viewpost], (error, results) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                const comment_data = results.map(comment => [comment.commenters, comment.comments, comment.dates]);
                res.json(comment_data);
        })
})

//endpoint that manages updating like value when the user likes a post
app.post("/likepost", requireAuth, (req, res) => {
        const liker = req.session.username;
        const owner = req.body.user;
        const id = req.body.id;
        connection.query("SELECT * FROM like_table WHERE likers = ? AND post_ids = ?", [liker, id], (error, results) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                if (results.length > 0){
                        connection.query("DELETE FROM like_table WHERE likers = ? AND post_ids = ?", [liker, id]);
                        connection.query("UPDATE user_posts SET likes = likes - 1 WHERE post_ids = ?", [id]);
                        res.json({valid: false})
                }
                else{
                        connection.query("INSERT INTO like_table (owners, post_ids, likers) VALUES (?,?,?)", [owner, id, liker]);
                        connection.query("INSERT INTO notifications (users, notifications) VALUES (?,?)", [owner, liker + " liked your post: "+id]);
                        connection.query("UPDATE user_posts SET likes = likes + 1 WHERE users = ? AND post_ids = ?", [owner, id]);
                        res.json({valid: true})
                }
        })
})

//endpoint to receive notification data for current user
app.get("/getnotifications", requireAuth, (req, res) => {
        const user = req.session.username;
        connection.query("SELECT * FROM notifications WHERE users = ?", [user], (error, results) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                const notifications = results.map(row => row.notifications);
                res.json(notifications);
        })
})

//endpoint to update session variables related to a user's search
app.post("/searchusers", requireAuth, (req, res) => {
        const search = req.body.search + "%";
        connection.query("SELECT username FROM accounts WHERE username LIKE ?", [search], (error, results) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                const usernames = results.map(user => user.username);
                req.session.searchresults = usernames;
                res.json(req.session.searchresults);
        })
})

//endpoint to receive the current user's data
app.get("/getuserdata", requireAuth, (req, res) => {
        const username = req.session.username;
        connection.query("SELECT * FROM user_posts WHERE users = ?", [username], (error, results) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                const user_posts = results.map(post => [post.files, post.post_ids]);
                res.json({user: username, posts: user_posts});
        })
})

//endpoint to receive a specific user's data
app.post("/viewprofile", requireAuth, (req, res) => {
        const username = req.body.username;
        connection.query("SELECT * FROM user_posts WHERE users = ?", [username], (error, results) => {
                if (error) {
                        res.status(500).json({ error: 'Internal Server Error' });
                }
                const user_posts = results.map(post => [post.files, post.post_ids]);
                res.json({user: username, posts: user_posts});
        })
})

//endpoint to receive search results
app.get("/getsearchresults", requireAuth, (req, res) => {
        res.json(req.session.searchresults);
})

//allows server to listen on port 1111 on local network ip
app.listen(1111, "0.0.0.0", () => {
        console.log("Running.......")
});
