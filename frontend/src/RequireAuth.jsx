import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "./api";

const RequireAuth = ({ children }) => {
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        axios.get("/getinfo")
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
