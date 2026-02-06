import { useMemo, useState } from "react";
import "./Jobs.css";

import { Job } from "./types";
import JobFilters, {
  JobFilterState,
} from "../../components/JobFilters";
import JobCard from "../../components/JobCard";
import JobTabs from "../../components/JobTabs";
import { useJobTracker } from "../../context/JobTrackerContext";

/* ------------------------------------------------------------------ */
/* MOCK DATA (replace with API later) */
/* ------------------------------------------------------------------ */
const mockJobs: Job[] = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "CareerTrack",
    location: "Remote",
    experience: "0-1",
    salary: "6-10",
    type: "Full-time",
    postedAt: "1 day ago",
  },
  {
    id: 2,
    title: "Backend Developer",
    company: "ProConnect",
    location: "Bangalore",
    experience: "2-3",
    salary: "10+",
    type: "Full-time",
    postedAt: "2 days ago",
  },
  {
    id: 3,
    title: "Full Stack Developer",
    company: "TechNova",
    location: "Delhi",
    experience: "0-1",
    salary: "3-6",
    type: "Part-time",
    postedAt: "3 days ago",
  },
];

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */
const Jobs = () => {
  const [activeTab, setActiveTab] = useState<"all" | "saved" | "applied">("all");
  const [filters, setFilters] = useState<JobFilterState | null>(null);

  const { trackedJobs } = useJobTracker();

  /* ------------------------------------------------------------------ */
  /* FILTER + TRACKING LOGIC */
  /* ------------------------------------------------------------------ */
  const filteredJobs = useMemo(() => {
    let jobs = [...mockJobs];

    // 🔹 Apply filters
    if (filters) {
      jobs = jobs.filter((job) => {
        if (filters.profile && job.title !== filters.profile) return false;
        if (filters.location && job.location !== filters.location) return false;
        if (filters.experience && job.experience !== filters.experience)
          return false;
        if (filters.salary && job.salary !== filters.salary) return false;
        if (filters.remote && job.location !== "Remote") return false;
        if (filters.partTime && job.type !== "Part-time") return false;
        return true;
      });
    }

    // 🔹 Apply tracking tabs
    if (activeTab === "saved") {
      jobs = jobs.filter((job) =>
        trackedJobs.some(
          (t) => t.jobId === job.id && t.status === "saved"
        )
      );
    }

    if (activeTab === "applied") {
      jobs = jobs.filter((job) =>
        trackedJobs.some(
          (t) => t.jobId === job.id && t.status === "applied"
        )
      );
    }

    return jobs;
  }, [filters, activeTab, trackedJobs]);

  /* ------------------------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------------------------ */
  return (
    <div className="jobs-page">
      {/* Header */}
      <header className="jobs-header">
        <h1>Jobs for You</h1>
        <p>Apply, save, and track jobs in real time</p>
      </header>

      {/* Tabs */}
      <JobTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* Layout */}
      <div className="jobs-layout">
        {/* Filters */}
        <JobFilters onApply={setFilters} />

        {/* Job List */}
        <section className="jobs-list">
          {filteredJobs.length === 0 ? (
            <div className="no-jobs">
              <p>No jobs found</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default Jobs;
