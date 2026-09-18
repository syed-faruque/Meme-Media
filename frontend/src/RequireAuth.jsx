import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

axios.defaults.withCredentials = true;

const RequireAuth = ({ children }) => {
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        axios.get("http://localhost:1111/getinfo")
            .then((response) => {
                setStatus(response.data.user ? "auth" : "guest");
            })
            .catch(() => setStatus("guest"));
    }, []);

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (status === "guest") {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RequireAuth;
