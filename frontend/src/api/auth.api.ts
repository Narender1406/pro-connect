import api from "./axios";

/* ===== AUTH ===== */

export const signup = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const login = async (data: {
  email: string;
  password: string;
}) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

/* ===== PROFILE ===== */

export const getProfile = async (token: string) => {
  const res = await api.get("/users/profile");
  return res.data;
};

export const updateProfile = async (
  token: string,
  profileData: { name: string; bio?: string }
) => {
  const res = await api.put("/users/profile", profileData);
  return res.data;
};
