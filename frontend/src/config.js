const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:1111").replace(/\/$/, "");

export function apiUrl(path = "") {
    if (!path) {
        return API_BASE;
    }
    return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mediaUrl(filePath) {
    if (!filePath) {
        return "";
    }
    if (/^https?:\/\//i.test(filePath)) {
        return filePath;
    }
    const fileName = String(filePath).split("/").pop();
    return apiUrl(`/${fileName}`);
}

export default API_BASE;
