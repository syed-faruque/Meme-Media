const express = require("express")
const cors = require("cors")
const session = require("express-session")
const sql = require("mysql2");
const multer = require("multer");
const uuid = require('uuid').v4;
const app = express();

app.use(cors({ origin: ["http://192.168.0.202:5173"], methods: ["POST", "GET"], credentials: true }))
app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: "secret", resave: false, saveUninitialized: false }))
app.use(express.json())
app.use(express.static("assets"));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {return cb(null, "assets")}, 
    filename: function (req, file, cb) {return cb(null, file.originalname)}
})

const upload = multer({ storage })

const connection = sql.createConnection({host: "localhost", user: "root", password: "", database: "storage"})

connection.connect((err) => {
    if (err) {
        console.error('error connecting to database: ' + err.stack);
    }
});

connection.query("CREATE TABLE IF NOT EXISTS accounts (username varchar(255), password varchar(255), email varchar(255));");
connection.query("CREATE TABLE IF NOT EXISTS user_posts (users varchar(255), files varchar(255), captions text, likes int, dates varchar(255), post_ids varchar(255));");
connection.query("CREATE TABLE IF NOT EXISTS comment_section (commenters varchar(255), comments text, dates varchar(255), post_ids varchar(255));");
connection.query("CREATE TABLE IF NOT EXISTS like_table (owners varchar(255), post_ids varchar(255), likers varchar(255));");
connection.query("CREATE TABLE IF NOT EXISTS notifications (users varchar(255), notifications text);");

app.post('/signup', (req, res) => {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    connection.query("select * from accounts where email = ? or username = ?", [email, username], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server Error' });
        }
        if (results.length > 0) {
            res.json({ valid: false });
        } else {
            connection.query("insert into accounts (email, username, password) values (?, ?, ?)", [email, username, password], (err) => {
                if (err) {
                    res.status(500).json({ error: 'internal server Error' });
                }
                res.json({ valid: true });
            });
        }
    });
});

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    connection.query("select * from accounts where email = ? and password = ?", [email, password], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
            return;
        }
        if (results.length > 0) {
            req.session.email = email;
            req.session.username = results[0].username;
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    });
});

app.get('/getinfo', (req, res) => {
    res.json({ user: req.session.username, email: req.session.email })
})

app.post('/upload', upload.single('file'), (req, res) => {
    const user = req.session.username;
    const path = req.file.path;
    const caption = req.body.caption;
    const date = new Date().toISOString().slice(0, 10);
    const id = uuid();
    connection.query("insert into user_posts (users, files, captions, likes, dates, post_ids) values (?,?,?,?,?,?)", [user, path, caption, 0, date, id], (error) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        res.json({ valid: true })
    });
})

app.get("/getfeeds", (req, res) => {
    let feed = [];
    connection.query("select users, files, captions, likes, dates, post_ids from user_posts", (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        if (results) {
            feed = results.map(post => [post.users, post.files, post.captions, post.likes, post.dates, post.post_ids]);
        }
        res.json(feed);
    })
})

app.post("/viewpost", (req, res) => {
    req.session.viewuser = req.body.user;
    req.session.viewpost = req.body.id;
    res.json({ valid: true });
})

app.get("/getpost", (req, res) => {
    connection.query("select * from user_posts where users = ? and post_ids = ?", [req.session.viewuser, req.session.viewpost], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        res.json({ user: results[0].users, file: results[0].files, caption: results[0].captions, date: results[0].dates })
    })
})

app.post("/addcomment", (req, res) => {
    const commenter = req.session.username;
    const owner = req.session.viewuser;
    const post = req.session.viewpost;
    const comment = req.body.comment;
    const date = new Date().toISOString().slice(0, 10);
    connection.query("insert into comment_section (post_ids, commenters, comments, dates) values (?,?,?,?)", [post, commenter, comment, date], (error) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        connection.query("insert into notifications (users, notifications) values (?,?)", [owner, commenter + " commented on your post: "+post]);
        res.json({ date: date, commenter: commenter })
    });
})

app.get("/getcomments", (req, res) => {
    connection.query("select * from comment_section where post_ids = ?", [req.session.viewpost], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        const comment_data = results.map(comment => [comment.commenters, comment.comments, comment.dates]);
        res.json(comment_data);
    })
})

app.post("/likepost", (req, res) => {
    const liker = req.session.username;
    const owner = req.body.user;
    const id = req.body.id;
    connection.query("select * from like_table where likers = ? and post_ids = ?", [liker, id], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        if (results.length > 0){
            connection.query("delete from like_table where likers = ? and post_ids = ?", [liker, id]);
            connection.query("update user_posts SET likes = likes - 1 where post_ids = ?", [id]);
            res.json({valid: false})
        }
        else{
            connection.query("insert into like_table (owners, post_ids, likers) values (?,?,?)", [owner, id, liker]);
            connection.query("insert into notifications (users, notifications) values (?,?)", [owner, liker + " liked your post: "+id]);
            connection.query("update user_posts SET likes = likes + 1 where users = ? AND post_ids = ?", [owner, id]);
            res.json({valid: true})
        }
    })
})

app.get("/getnotifications", (req, res) => {
    const user = req.session.username;
    connection.query("select * from notifications where users = ?", [user], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        const notifications = results.map(row => row.notifications);
        res.json(notifications);
    })
})

app.post("/searchusers", (req, res) => {
    const search = req.body.search + "%";
    connection.query("select * from accounts where username like ?", [search], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        const usernames = results.map(user => user.username);
        req.session.searchresults = usernames;
        res.json(req.session.searchresults);
    })
})

app.get("/getuserdata", (req, res) => {
    const username = req.session.username;
    connection.query("select * from user_posts where users = ?", [username], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        const user_posts = results.map(post => [post.files, post.post_ids]);
        res.json({user: username, posts: user_posts});
    })
})

app.post("/viewprofile", (req, res) => {
    const username = req.body.username;
    connection.query("select * from user_posts where users = ?", [username], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'internal server error' });
        }
        const user_posts = results.map(post => [post.files, post.post_ids]);
        res.json({user: username, posts: user_posts});
    })
})

app.get("/getsearchresults", (req, res) => {
    res.json(req.session.searchresults);
})

app.listen(1111, "0.0.0.0", () => {
    console.log("Running.......")
});