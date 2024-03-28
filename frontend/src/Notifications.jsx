import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = () => {
        axios.get("http://192.168.0.202:1111/getnotifications")
            .then((response) => {
                setNotifications(response.data.reverse());
            })
            .catch((error) => {
                console.error("Error fetching notifications:", error);
            });
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

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