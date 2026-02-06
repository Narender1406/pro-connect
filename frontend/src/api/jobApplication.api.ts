import axios from "./axios";

export const applyJobApi = (jobId: string) =>
  axios.post("/job-applications/apply", { jobId });

export const getMyApplications = () =>
  axios.get("/job-applications/my-applications");
