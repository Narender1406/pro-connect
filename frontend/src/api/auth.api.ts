import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

/* ===== AUTH ===== */

export const signup = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

export const login = async (data: {
  email: string;
  password: string;
}) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

/* ===== PROFILE ===== */

export const getProfile = async (token: string) => {
  const res = await API.get("/users/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const updateProfile = async (
  token: string,
  profileData: { name: string; bio?: string }
) => {
  const res = await API.put("/users/profile", profileData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
