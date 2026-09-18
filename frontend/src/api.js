import axios from "axios";
import { apiUrl } from "./config";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = apiUrl();

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
