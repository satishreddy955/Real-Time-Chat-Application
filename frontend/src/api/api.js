import axios from "axios";

const api = axios.create({
  baseURL: "https://real-time-chat-application-1-0hnv.onrender.com/api", // ✅ backend base URL
  headers: {
    "Content-Type": "application/json"
  }
});

// ✅ Automatically attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
