import { api } from "../services/api";
import { ApiResponse } from "../types/api.types";

export interface Activity {
  _id: string;
  type: "post" | "comment" | "application";
  content: string;
  createdAt: string;
}

export const getUserActivity = () => {
  return api.get<ApiResponse<Activity[]>>("/activity");
};
