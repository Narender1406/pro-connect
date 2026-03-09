import axios from "axios";
import { showToast } from "../utils/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      showToast.error("Session expired. Please login again.");
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1000);
    } else if (error.response?.status === 500) {
      showToast.error("Server error. Please try again later.");
    } else if (error.code === "ECONNABORTED") {
      showToast.error("Request timeout. Please check your connection.");
    }
    return Promise.reject(error);
  }
);

export default api;
