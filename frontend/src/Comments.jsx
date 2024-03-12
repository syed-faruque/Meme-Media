//necessary imports
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";

//giving axios permission to make requests to my server
axios.defaults.withCredentials = true;

const Comments = () => {
    const [postcontents, setPostcontents] = useState(null);
    const [currentcomment, setCurrentcomment] = useState("");
    const [newcomments, setNewcomments] = useState([]);
    const [oldcomments, setOldcomments] = useState([]);

    //fetches the post and its caption from the server
    const fetchPostContents = () => {
        axios.get("http://192.168.0.202:1111/getpost")
            .then((response) => {
                setPostcontents(response.data);
            })
            .catch(error => console.error("Error fetching post contents:", error));
    }
    
    //fetches the old comments that were made to the post from the server
    const fetchOldcomments = () => {
        axios.get("http://192.168.0.202:1111/getcomments")
            .then((response) => {
                setOldcomments(response.data);
            })
            .catch(error => console.error("Error fetching old comments:", error));
    }

    //updates the currentcomment state
    const handleChange = (event) => {
        setCurrentcomment(event.target.value);
    }

    //when the user posts the comment, this sends the comment data over to the serverside
    const handleSubmit = (event) => {
        event.preventDefault();
        axios.post("http://192.168.0.202:1111/addcomment", { comment: currentcomment })
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

    //below I put the post contents on the top and the comments underneath. New comments are placed above old comments.
    return (
        <div className="commentsection">
            <Navbar /><br /><br />
            <div className="viewpost">
                <div className="post-header">
                    <span className="username">{postcontents.user}</span><br></br>
                    <span className="date">{postcontents.date}</span><br></br><br></br>
                </div>
                <div className="post-body">
                    <img src={`http://192.168.0.202:1111/${(postcontents.file).split('/').pop()}`} alt="post" />
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
                {newcomments && newcomments.map((comment) => {
                    return (
                        <div className="newcomment" key={comment[2]}>
                            <span className="commenter">{comment[0]}</span>
                            <span className="date">{comment[2]}</span><br />
                            <span className="comment">{comment[1]}</span>
                        </div>
                    );
                })}

                {oldcomments && oldcomments.map((comment) => {
                    return (
                        <div className="oldcomment" key={comment[2]}>
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
