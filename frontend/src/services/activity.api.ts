import { api } from "./api";

export const getMyPosts = async () => {
  return api("/posts/my");
};

export const getSavedJobs = async () => {
  return api("/jobs/saved");
};
