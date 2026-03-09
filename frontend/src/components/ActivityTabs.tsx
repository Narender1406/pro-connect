import { useEffect, useState } from "react";
import { jobAPI } from "../api/job.api";

type Application = {
  _id: string;
  title: string;
  company: string;
  applicationStatus: string;
  appliedAt: string;
};

const ActivityTabs = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        const data = await jobAPI.getMyApplications();
        setApplications(data || []);
      } catch (err) {
        console.error("Activity error:", err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, []);

  if (loading) return <p style={{ padding: "1rem", color: "#94a3b8" }}>Loading activity...</p>;

  return (
    <div className="activity-list" style={{ padding: "1rem" }}>
      <h3 style={{ color: "#f1f5f9", marginBottom: "1rem" }}>Recent Applications</h3>
      {applications.length > 0 ? (
        applications.map((app) => (
          <div key={app._id} style={{
            padding: "1rem",
            background: "linear-gradient(135deg, #1e293b, #0f172a)",
            border: "1px solid #334155",
            borderRadius: "8px",
            marginBottom: "0.75rem"
          }}>
            <h4 style={{ color: "#f1f5f9", margin: "0 0 0.5rem" }}>{app.title}</h4>
            <p style={{ color: "#94a3b8", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>{app.company}</p>
            <span style={{
              display: "inline-block",
              padding: "0.25rem 0.75rem",
              background: "#2563eb",
              color: "white",
              borderRadius: "12px",
              fontSize: "0.8125rem",
              fontWeight: "600"
            }}>
              {app.applicationStatus}
            </span>
          </div>
        ))
      ) : (
        <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>No applications yet</p>
      )}
    </div>
  );
};

export default ActivityTabs;
