//necessary imports
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";

//makes credentials visible for all requests sent out by axios
axios.defaults.withCredentials = true;

//comments component
const Comments = () => {
    const [postcontents, setPostcontents] = useState(null);
    const [currentcomment, setCurrentcomment] = useState("");
    const [newcomments, setNewcomments] = useState([]);
    const [oldcomments, setOldcomments] = useState([]);

    //function for fetching post content
    const fetchPostContents = () => {
        axios.get("http://192.168.0.202:1111/getpost")
            .then((response) => {
                setPostcontents(response.data);
            })
            .catch(error => console.error("Error fetching post contents:", error));
    }

    //function for fetching old comments previously made on the post
    const fetchOldcomments = () => {
        axios.get("http://192.168.0.202:1111/getcomments")
            .then((response) => {
                setOldcomments(response.data);
            })
            .catch(error => console.error("Error fetching old comments:", error));
    }

    //function for updating the state of the current comment when user types it
    const handleChange = (event) => {
        setCurrentcomment(event.target.value);
    }

    //function for sending out the data for a comment made by the user to the serverside
    const handleSubmit = (event) => {
        event.preventDefault();
        axios.post("http://192.168.0.202:1111/addcomment", { comment: currentcomment })
            .then((response) => {
                setNewcomments([...newcomments, [response.data.commenter, currentcomment, response.data.date]]);
                setCurrentcomment("");
            })
            .catch(error => console.error("Error submitting comment:", error));
    }

    //initiates the fetch-related functions as soon as the component mounts
    useEffect(() => {
        fetchPostContents();
        fetchOldcomments();
    }, [])

    //displays a loading message if the post content is empty
    if (postcontents === null) {
        return <div>Loading...</div>;
    }

    // displays post content followed by a comment input. Then maps out new comments followed by old comments.
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
