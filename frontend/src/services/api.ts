// src/services/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 8000,
});

/* =========================
   RETRY CONFIG
========================= */

const MAX_RETRIES = 2;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;

    if (!config || config.__retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config.__retryCount = (config.__retryCount || 0) + 1;

    await new Promise((r) => setTimeout(r, 800)); // small delay
    return api(config);
  }
);
