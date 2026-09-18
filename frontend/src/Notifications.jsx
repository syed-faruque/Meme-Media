import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = () => {
        axios.get("http://localhost:1111/getnotifications")
            .then((response) => {
                setNotifications(response.data.reverse());
            })
            .catch((error) => {
                console.error("Error fetching notifications:", error);
            });
    };

    const clearNotifications = () => {
        axios.post("http://localhost:1111/clearnotifications")
            .then(() => {
                setNotifications([]);
            })
            .catch((error) => {
                console.error("Error clearing notifications:", error);
            });
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div className="notifications-container">
            <Navbar />
            <div className="notifications">
                <div className="notifications-header">
                    <h2 className="notifications-heading">Notifications</h2>
                    {notifications.length > 0 && (
                        <button type="button" className="clear-notifications" onClick={clearNotifications}>
                            Clear all
                        </button>
                    )}
                </div>
                <div className="notifications-list">
                    {notifications.length === 0 && (
                        <div className="notification">No notifications</div>
                    )}
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
