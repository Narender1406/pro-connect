import { Job } from "../pages/Jobs";
import "./JobCard.css";

type Props = {
  job: Job;
  onSave: (id: number) => void;
};

export default function JobCard({ job, onSave }: Props) {
  return (
    <div className="job-card">
      <div>
        <h3>{job.title}</h3>
        <p>{job.company} • {job.location}</p>
      </div>

      <button onClick={() => onSave(job.id)}>
        {job.saved ? "★ Saved" : "☆ Save"}
      </button>
    </div>
  );
}
