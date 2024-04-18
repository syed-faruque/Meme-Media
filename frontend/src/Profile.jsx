import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

axios.defaults.withCredentials = true;

const Profile = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [userposts, setUserposts] = useState([]);


    const fetchData = () => {
        axios.get("http://192.168.0.202:1111/getuserdata")
            .then((response) => {
                setUsername(response.data.user);
                setUserposts(response.data.posts.reverse());
            })
    }

    const handleImageClick = (index) => {
        axios.post("http://192.168.0.202:1111/viewpost", {user: username, id: userposts[index][1]})
        .then((response) => {
            if (response.data.valid){
                navigate("/comments")
            }
        })
        .catch(error => console.error("Error fetching info:", error));
    }

    useEffect(() => {
        fetchData();
    }, []);


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
