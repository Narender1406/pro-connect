// src/components/settings/AccountPreferences.tsx
import { useState } from "react";
import { updatePreferences } from "../../services/settings.api";
import { showSuccess, showError } from "../../services/toast";
import "./AccountSecurity.css";

export default function AccountPreferences() {
  const [jobAlerts, setJobAlerts] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      await updatePreferences({
        jobAlerts,
        autoSave,
      });

      showSuccess("Preferences updated successfully");
    } catch (err) {
      showError(err as any);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-card">
      <h3 className="settings-title">Preferences</h3>

      <div className="settings-group">
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={jobAlerts}
            onChange={(e) => setJobAlerts(e.target.checked)}
          />
          <span>Job alerts & recommendations</span>
        </label>

        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
          <span>Auto-save applied jobs</span>
        </label>
      </div>

      <button
        className="settings-btn"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </div>
  );
}
