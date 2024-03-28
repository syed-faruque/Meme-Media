//necessary imports
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

//makes credentials visible for all requests sent out by axios
axios.defaults.withCredentials = true;

//userprofile component
const UserProfile = () => {
    const { username } = useParams();
    const [usernameFromParams, setUsernameFromParams] = useState('');
    const [userposts, setUserposts] = useState([]);
    const navigate = useNavigate()

    //initiates fetch function as soon as the component mounts
    useEffect(() => {
        fetchData(username);
    }, [username]);

    //function for fetching the data for a specific user from the server. This data includes his posts.
    const fetchData = (username) => {
        axios.post("http://192.168.0.202:1111/viewprofile", { username })
            .then((response) => {
                setUsernameFromParams(response.data.user);
                setUserposts(response.data.posts.reverse());
            })
            .catch((error) => {
                console.error("Error fetching profile data:", error);
            });
    };

    //function for navigating to the post the user clicks on.
    const handleImageClick = (index) => {
        axios.post("http://192.168.0.202:1111/viewpost", {user: username, id: userposts[index][0]})
        .then((response) => {
            if (response.data.valid){
                navigate("/comments")
            }
        })
        .catch(error => console.error("Error fetching info:", error));
    }

    //display's the person's username and below maps out all of that user's posts.
    return (
        <div className="profile-container">
            <Navbar />
            <div className="profile-info">
                <p className="info-username">{usernameFromParams}</p>
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
};

export default UserProfile;
