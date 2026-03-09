import api from "./axios";

export const jobAPI = {
  // Get jobs with filters
  getJobs: async (filters?: {
    search?: string;
    location?: string;
    jobType?: string;
    experienceLevel?: string;
    locationType?: string;
    category?: string;
    salaryMin?: number;
    salaryMax?: number;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get("/jobs", { params: filters });
    return res.data;
  },

  // Get single job
  getJobById: async (jobId: string) => {
    const res = await api.get(`/jobs/${jobId}`);
    return res.data;
  },

  // Create job
  createJob: async (jobData: any) => {
    const res = await api.post("/jobs", jobData);
    return res.data;
  },

  // Apply to job
  applyToJob: async (jobId: string, applicationData: { resume?: string; coverLetter?: string }) => {
    const res = await api.post(`/jobs/${jobId}/apply`, applicationData);
    return res.data;
  },

  // Get my applications
  getMyApplications: async () => {
    const res = await api.get("/jobs/my-applications");
    return res.data;
  },

  // Get my posted jobs
  getMyJobs: async () => {
    const res = await api.get("/jobs/my-jobs");
    return res.data;
  },

  // Update application status
  updateApplicationStatus: async (jobId: string, applicantId: string, status: string) => {
    const res = await api.patch("/jobs/application-status", {
      jobId,
      applicantId,
      status,
    });
    return res.data;
  },

  // Delete job
  deleteJob: async (jobId: string) => {
    const res = await api.delete(`/jobs/${jobId}`);
    return res.data;
  },
};
