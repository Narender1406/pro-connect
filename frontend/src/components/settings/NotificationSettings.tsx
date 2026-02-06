export default function NotificationsSettings() {
  return (
    <div className="settings-card">
      <h3>Notifications</h3>
      <p>Control how and when we notify you.</p>

      <div className="pref-item">
        <span>Job application updates</span>
        <input type="checkbox" defaultChecked />
      </div>

      <div className="pref-item">
        <span>New job alerts</span>
        <input type="checkbox" defaultChecked />
      </div>

      <div className="pref-item">
        <span>Email newsletters</span>
        <input type="checkbox" />
      </div>
    </div>
  );
}
