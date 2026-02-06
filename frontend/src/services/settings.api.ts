// src/services/settings.api.ts
import { api } from "./api";
import { ApiResponse } from "../types/api.types";
import { AccountSettings } from "../types/settings.types";
import { Application } from "../types/application.types";

/* =======================
   ACCOUNT SETTINGS
======================= */

// Get account settings
export const getAccountSettings = async () => {
  const res = await api.get<ApiResponse<AccountSettings>>("/settings");
  return res.data;
};

// Update user preferences
export const updatePreferences = async (
  preferences: AccountSettings["preferences"]
) => {
  const res = await api.put<ApiResponse<AccountSettings>>(
    "/settings/preferences",
    preferences
  );
  return res.data;
};

/* =======================
   APPLICATIONS
======================= */

// Get applied jobs / applications
export const getApplications = async () => {
  const res = await api.get<ApiResponse<Application[]>>("/applications");
  return res.data;
};
