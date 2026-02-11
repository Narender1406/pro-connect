import { useEffect, useState } from "react";
import { getApplications } from "../../services/settings.api";
import Skeleton from "../ui/Skeleton";
import { Application } from "../../types/application.types";

export default function ApplicationsSettings() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const res = await getApplications();

        // ✅ ApiResponse<Application[]>
        const apps = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        setApplications(apps);
      } catch (error) {
        console.error("Failed to load applications", error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  if (loading) {
    return (
      <div className="settings-card">
        <h3>My Applications</h3>
        <Skeleton height={22} />
        <Skeleton height={22} />
        <Skeleton height={22} />
      </div>
    );
  }

  return (
    <div className="settings-card">
      <h3>My Applications</h3>

      {applications.length === 0 ? (
        <p className="muted-text">No applications yet</p>
      ) : (
        applications.map((app) => (
          <div key={app._id} className="application-row">
            {/* ✅ CANONICAL FIELD */}
            <span>{app.jobTitle || "Untitled Role"}</span>

            <span className={`status ${app.status}`}>
              {app.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
