
import "./AccountSecurity.css";

export default function AccountSecurity() {
  return (
    <div className="settings-card">
      <h3>Account & Security</h3>
      <p>Manage your account credentials and security settings.</p>

      <div className="security-item">
        <div>
          <h4>Email Address</h4>
          <span>Update your login email</span>
        </div>
        <button className="secondary-btn">Change</button>
      </div>

      <div className="security-item">
        <div>
          <h4>Password</h4>
          <span>Change your account password</span>
        </div>
        <button className="secondary-btn">Update</button>
      </div>

      <div className="security-item danger">
        <div>
          <h4>Delete Account</h4>
          <span>This action is permanent</span>
        </div>
        <button className="danger-btn">Delete</button>
      </div>
    </div>
  );
}
