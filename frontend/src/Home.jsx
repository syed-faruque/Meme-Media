//necessary imports
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

//makes credentials visible for all requests sent out by axios
axios.defaults.withCredentials = true;

//home component
const Home = () => {
    const navigate = useNavigate();
    const [feeds, setFeeds] = useState([]);

    //function for fetching feed data from the server.
    const getFeeds = () => {
        axios.get("http://192.168.0.202:1111/getfeeds")
        .then((response) => {
            setFeeds(response.data.slice().reverse());
        })
        .catch(error => console.error("Error fetching info:", error));
    };

    useEffect(() => {
        getFeeds();
    }, []);

    //function for informing the server of the post the user wants to view, and then navigating to the comment section of that post
    const handleViewPost = (index) => {
        axios.post("http://192.168.0.202:1111/viewpost", {user: feeds[index][0], id: feeds[index][5]})
        .then((response) => {
            if (response.data.valid){
                navigate("/comments")
            }
        })
        .catch(error => console.error("Error fetching info:", error));

    };

    //function for informing the server when the user presses the like button. This also increments the state of the like value so the user can see it change
    const handleLike = (index) => {
        axios.post("http://192.168.0.202:1111/likepost", {user: feeds[index][0], id: feeds[index][5]})
        .then((response) => {
            if (response.data.valid){
                const newfeeds = feeds.slice();
                newfeeds[index][3] = newfeeds[index][3] + 1;
                setFeeds(newfeeds);
            }
            else{
                const newfeeds = feeds.slice();
                newfeeds[index][3] = newfeeds[index][3] - 1;
                setFeeds(newfeeds);
            }
        })
    };

    //maps out all the post data that was fetched from the server
    return (
        <div className="home">
            <Navbar /><br></br><br></br>
            <div className="feedcontents">
                {feeds.map((feed, index) => (
                    <div className="feed-post" key={index}>
                        <div className="post-header">
                            <span className="username">{feed[0]}</span><br></br>
                            <span className="date">{feed[4]}</span><br></br><br></br>
                        </div>
                        <div className="post-body">
                            <img src={`http://192.168.0.202:1111/${feed[1].split('/').pop()}`} alt="post" /><br/>
                            <span className="like-num">{feed[3]} likes</span><br></br>
                            <p className="caption">{feed[2]}</p>
                        </div>
                        <div className="post-footer">
                            <button className= "likebutton" onClick={() => handleLike(index)}>Like</button>
                            <button className= "viewbutton" onClick={() => handleViewPost(index)}>Comment</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
