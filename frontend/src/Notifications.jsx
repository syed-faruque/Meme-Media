//necessary imports
import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

//makes credentials visible for all requests sent out by axios
axios.defaults.withCredentials = true;

//notifications component
const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    //function for fetching notification data from the server
    const fetchNotifications = () => {
        axios.get("http://192.168.0.202:1111/getnotifications")
            .then((response) => {
                setNotifications(response.data.reverse());
            })
            .catch((error) => {
                console.error("Error fetching notifications:", error);
            });
    };

    //initiates the fetch function as soon as the component mounts
    useEffect(() => {
        fetchNotifications();
    }, []);

    //maps out all the notifications
    return (
        <div className="notifications-container">
            <Navbar />
            <div className="notifications">
                <h2 className="notifications-heading">Notifications</h2>
                <div className="notifications-list">
                    {notifications.map((notification, index) => (
                        <div className="notification" key={index}>
                            {notification}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
