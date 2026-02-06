import  { api } from "./api";

/* -------- Preferences -------- */
export const updatePreferences = async (data: any) => {
  const res = await api.put("/settings/preferences", data);
  return res.data;
};

/* -------- Notifications -------- */
export const updateNotifications = async (data: any) => {
  const res = await api.put("/settings/notifications", data);
  return res.data;
};

/* -------- Applications -------- */
export const getApplications = async () => {
  const res = await api.get("/settings/applications");
  return res.data;
};
