import "./ApplyModal.css";

interface Job {
  role: string;
  company: string;
}

export default function ApplyModal({ job, onClose, onApply }: { job: Job; onClose: () => void; onApply: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Apply for {job.role}</h3>
        <p>{job.company}</p>

        <textarea placeholder="Why are you a good fit?" />

        <div className="modal-actions">
          <button className="apply-btn" onClick={onApply}>
            Submit Application
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
