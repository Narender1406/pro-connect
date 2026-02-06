import { useEffect, useState } from "react";
import { getApplications } from "../../services/settings.api";

export default function ApplicationsSettings() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    getApplications().then(setApps);
  }, []);

  return (
    <div className="settings-card">
      <h3>My Applications</h3>

      <ul className="applications-list">
        {apps.map((app: any) => (
          <li key={app.jobId}>
            <span>{app.company}</span>
            <span className={`badge ${app.status}`}>
              {app.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
