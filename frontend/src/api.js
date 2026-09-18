import axios from "axios";

axios.defaults.withCredentials = true;

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const path = window.location.pathname;
            if (path !== "/" && path !== "/signup" && path !== "/success") {
                window.location.href = "/";
            }
        }
        return Promise.reject(error);
    }
);

export default axios;
