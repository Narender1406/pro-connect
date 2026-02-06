import { Job } from "../pages/Jobs/types";
import { useJobTracker } from "../context/JobTrackerContext";
import "./JobCard.css";

const statusLabelMap = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
};

const JobCard = ({ job }: { job: Job }) => {
  const { saveJob, applyJob, getStatus } = useJobTracker();
  const status = getStatus(job.id);

  return (
    <div className="job-card">
      <div className="job-main">
        <h3>{job.title}</h3>
        <p>{job.company} • {job.location}</p>
        <span className="job-meta">
          {job.experience} yrs • ₹{job.salary} LPA
        </span>
      </div>

      <div className="job-actions">
        {/* STATUS BADGE */}
        {status && (
          <span className={`status-badge ${status}`}>
            {statusLabelMap[status]}
          </span>
        )}

        {/* ACTION BUTTONS */}
        {!status || status === "saved" ? (
          <button className="apply-btn" onClick={() => applyJob(job.id)}>
            Apply
          </button>
        ) : null}

        {!status && (
          <button className="save-btn" onClick={() => saveJob(job.id)}>
            Save
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;
