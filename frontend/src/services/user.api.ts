import { api } from "./api";

export const getProfile = () => api("/users/me");

export const updateProfile = (data: any) =>
  api("/users/update", {
    method: "PUT",
    body: JSON.stringify(data),
  });
