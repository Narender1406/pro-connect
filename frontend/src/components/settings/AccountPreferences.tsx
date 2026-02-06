import { useState } from "react";
import { updatePreferences } from "../../services/settings.api";
import "./AccountSecurity.css";

export default function AccountPreferences() {
  const [jobAlerts, setJobAlerts] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePreferences({ jobAlerts, autoSave });
      alert("Preferences updated ✅");
    } catch (err) {
      alert("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-card">
      <h3>Preferences</h3>

      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={jobAlerts}
          onChange={(e) => setJobAlerts(e.target.checked)}
        />
        Job alerts & recommendations
      </label>

      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={autoSave}
          onChange={(e) => setAutoSave(e.target.checked)}
        />
        Auto-save applied jobs
      </label>

      <button className="settings-btn" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </div>
  );
}
