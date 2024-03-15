import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

axios.defaults.withCredentials = true;

const Home = () => {
    const navigate = useNavigate();

    //made a usestate here because I want the feeds variable to always be up to date
    const [feeds, setFeeds] = useState([]);


    //function for fetching all the posts and their info from the server
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

    //function that lets the server know to update session variables and also naviagtes the user when he wants to view a post
    const handleViewPost = (index) => {
        axios.post("http://192.168.0.202:1111/viewpost", {user: feeds[index][0], file: feeds[index][1]})
        .then((response) => {
            if (response.data.valid){
                navigate("/comments")
            }
        })
        .catch(error => console.error("Error fetching info:", error));

    };

    //function that lets the server know if a user presses the like button. Allows for the liketable in the database to be updated. Also increments the value for feeds[index][3] which contains the amount of likes.
    const handleLike = (index) => {
        axios.post("http://192.168.0.202:1111/likepost", {user: feeds[index][0], file: feeds[index][1]})
        .then((response) => {
            if (response.data.valid){
                const newfeeds = feeds.slice();
                newfeeds[index][3] = newfeeds[index][3] + 1; //increments number of likes
                setFeeds(newfeeds);
            }
            else{
                const newfeeds = feeds.slice();
                newfeeds[index][3] = newfeeds[index][3] - 1;    //decrements number of likes incase a user unlikes
                setFeeds(newfeeds);
            }
        })
    };

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
                        <div className= "divider"></div>
                        <div className="post-body">
                            <img src={`http://192.168.0.202:1111/${feed[1].split('/').pop()}`} alt="post" />
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
