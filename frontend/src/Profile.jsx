//necessary imports
import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

//makes credentials visible for all requests sent out by axios
axios.defaults.withCredentials = true;

//profile component
const Profile = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [userposts, setUserposts] = useState([]);

    //function for fetching the user's data from the serverside
    const fetchData = () => {
        axios.get("http://192.168.0.202:1111/getuserdata")
            .then((response) => {
                setUsername(response.data.user);
                setUserposts(response.data.posts.reverse());
            })
    }

    //function for navigating to the post that the user clicks on
    const handleImageClick = (index) => {
        axios.post("http://192.168.0.202:1111/viewpost", {user: username, id: userposts[index][1]})
        .then((response) => {
            if (response.data.valid){
                navigate("/comments")
            }
        })
        .catch(error => console.error("Error fetching info:", error));
    }

    //initiates the fetch functions as soon as the component mounts.
    useEffect(() => {
        fetchData();
    }, []);


    //displays the username followed by a mapping of all the user's previous posts
    return (
        <div className="profile-container">
            <Navbar />
            <div className="profile-info">
                <p className="info-username">{username}</p>
            </div>
            <div className="profile-divider"></div>
            <div className="user-posts">
                {userposts.map((post, index) => {
                    return (
                        <div key={index} className="post-image">
                            <img src={`http://192.168.0.202:1111/${post[0].split('/').pop()}`} alt={`Post ${index + 1}`} onClick={() => handleImageClick(index)} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Profile;
