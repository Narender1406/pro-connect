import { api } from "./api";
import { Job } from "../types/jobs";

export const getJobs = async (): Promise<Job[]> => {
  return api("/jobs");
};

