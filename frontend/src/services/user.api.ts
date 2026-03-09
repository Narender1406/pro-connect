import api from "../api/axios";

export const getProfile = () => api.get("/users/profile");

export const updateProfile = (data: any) => api.put("/users/profile", data);
