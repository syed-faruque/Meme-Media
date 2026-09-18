import { useEffect, useState } from "react";
import axios from "./api";
import { mediaUrl } from "./config";
import Navbar from "./Navbar";

const Comments = () => {
    const [postcontents, setPostcontents] = useState(null);
    const [currentcomment, setCurrentcomment] = useState("");
    const [newcomments, setNewcomments] = useState([]);
    const [oldcomments, setOldcomments] = useState([]);

    const fetchPostContents = () => {
        axios.get("/getpost")
            .then((response) => {
                setPostcontents(response.data);
            })
            .catch(error => {
                console.error("Error fetching post contents:", error);
                setPostcontents(false);
            });
    }

    const fetchOldcomments = () => {
        axios.get("/getcomments")
            .then((response) => {
                setOldcomments(response.data);
            })
            .catch(error => console.error("Error fetching old comments:", error));
    }

    const handleChange = (event) => {
        setCurrentcomment(event.target.value);
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        axios.post("/addcomment", { comment: currentcomment })
            .then((response) => {
                setNewcomments([...newcomments, [response.data.commenter, currentcomment, response.data.date]]);
                setCurrentcomment("");
            })
            .catch(error => console.error("Error submitting comment:", error));
    }

    useEffect(() => {
        fetchPostContents();
        fetchOldcomments();
    }, [])

    if (postcontents === null) {
        return <div>Loading...</div>;
    }

    if (postcontents === false) {
        return (
            <div className="commentsection">
                <Navbar /><br /><br />
                <div className="viewpost">Post not found.</div>
            </div>
        );
    }

    return (
        <div className="commentsection">
            <Navbar /><br /><br />
            <div className="viewpost">
                <div className="post-header">
                    <span className="username">{postcontents.user}</span><br></br>
                    <span className="date">{postcontents.date}</span><br></br><br></br>
                </div>
                <div className="post-body">
                    <img src={mediaUrl(postcontents.file)} alt="post" />
                    <p className="caption">{postcontents.caption}</p>
                </div>
            </div>
            <div className="usercomment">
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Write a comment..." value={currentcomment} onChange={handleChange} />
                    <input type="submit" value="Post comment" />
                </form>
            </div>
            <div className="comments">
                {newcomments && newcomments.map((comment, index) => {
                    return (
                        <div className="newcomment" key={index}>
                            <span className="commenter">{comment[0]}</span>
                            <span className="date">{comment[2]}</span><br />
                            <span className="comment">{comment[1]}</span>
                        </div>
                    );
                })}

                {oldcomments && oldcomments.map((comment, index) => {
                    return (
                        <div className="oldcomment" key={index}>
                            <span className="commenter">{comment[0]}</span>
                            <span className="date">{comment[2]}</span><br />
                            <span className="comment">{comment[1]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Comments;
