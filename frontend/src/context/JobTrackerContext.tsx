import { createContext, useContext, useEffect, useState } from "react";

type JobStatus = "saved" | "applied" | "interview" | "rejected";

type TrackedJob = {
  jobId: number;
  status: JobStatus;
  appliedAt?: string;
};

type JobTrackerContextType = {
  trackedJobs: TrackedJob[];
  saveJob: (jobId: number) => void;
  applyJob: (jobId: number) => void;
  getStatus: (jobId: number) => JobStatus | null;
};

const JobTrackerContext = createContext<JobTrackerContextType | null>(null);

export const JobTrackerProvider = ({ children }: { children: React.ReactNode }) => {
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>(() => {
    const stored = localStorage.getItem("trackedJobs");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("trackedJobs", JSON.stringify(trackedJobs));
  }, [trackedJobs]);

  const saveJob = (jobId: number) => {
    if (trackedJobs.some(j => j.jobId === jobId)) return;

    setTrackedJobs(prev => [...prev, { jobId, status: "saved" }]);
  };

  const applyJob = (jobId: number) => {
    setTrackedJobs(prev => {
      const exists = prev.find(j => j.jobId === jobId);
      if (exists) {
        return prev.map(j =>
          j.jobId === jobId
            ? { ...j, status: "applied", appliedAt: new Date().toISOString() }
            : j
        );
      }
      return [...prev, { jobId, status: "applied", appliedAt: new Date().toISOString() }];
    });
  };

  const getStatus = (jobId: number) => {
    return trackedJobs.find(j => j.jobId === jobId)?.status || null;
  };

  return (
    <JobTrackerContext.Provider value={{ trackedJobs, saveJob, applyJob, getStatus }}>
      {children}
    </JobTrackerContext.Provider>
  );
};

export const useJobTracker = () => {
  const ctx = useContext(JobTrackerContext);
  if (!ctx) throw new Error("useJobTracker must be used inside JobTrackerProvider");
  return ctx;
};
