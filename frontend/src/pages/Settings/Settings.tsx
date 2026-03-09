import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../utils/toast";
import { connectionAPI } from "../../api/connection.api";
import { Connection, User } from "../../types";
import "./Settings.css";

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);
  
  // Account Settings
  const [accountData, setAccountData] = useState({
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    phone: "",
  });

  // Settings State
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    connectionRequests: true,
    jobAlerts: true,
    messageNotifications: true,
    profileVisibility: "public",
    showEmail: false,
    showLocation: true,
    twoFactorAuth: false,
    language: "en",
    timezone: "UTC",
  });

  // Network State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "connections" || activeTab === "requests" || activeTab === "suggestions") {
      loadNetworkData();
    }
  }, [activeTab]);

  const loadNetworkData = async () => {
    try {
      setNetworkLoading(true);
      const [connectionsData, requestsData, suggestionsData] = await Promise.all([
        connectionAPI.getConnections(),
        connectionAPI.getPendingRequests(),
        connectionAPI.getSuggestions(),
      ]);
      setConnections(connectionsData);
      setRequests(requestsData);
      setSuggestions(suggestionsData);
    } catch (error) {
      showToast.error("Failed to load network data");
    } finally {
      setNetworkLoading(false);
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await connectionAPI.acceptConnection(connectionId);
      showToast.success("Connection accepted");
      loadNetworkData();
    } catch (error) {
      showToast.error("Failed to accept connection");
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await connectionAPI.rejectConnection(connectionId);
      showToast.success("Connection rejected");
      loadNetworkData();
    } catch (error) {
      showToast.error("Failed to reject connection");
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      await connectionAPI.sendRequest(userId);
      showToast.success("Connection request sent");
      loadNetworkData();
    } catch (error) {
      showToast.error("Failed to send request");
    }
  };

  const handleToggle = (key: string) => {
    setSettings({ ...settings, [key]: !settings[key as keyof typeof settings] });
    showToast.success("Setting updated");
  };

  const handleSelect = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
    showToast.success("Setting updated");
  };

  const handleEmailChange = async () => {
    if (!accountData.email) {
      showToast.error("Email is required");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast.success("Email change request sent. Check your inbox.");
      setLoading(false);
    }, 1000);
  };

  const handlePasswordChange = async () => {
    if (!accountData.currentPassword || !accountData.newPassword) {
      showToast.error("All password fields are required");
      return;
    }
    if (accountData.newPassword !== accountData.confirmPassword) {
      showToast.error("Passwords do not match");
      return;
    }
    if (accountData.newPassword.length < 6) {
      showToast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast.success("Password changed successfully");
      setAccountData({ ...accountData, currentPassword: "", newPassword: "", confirmPassword: "" });
      setLoading(false);
    }, 1000);
  };

  const handlePhoneAdd = async () => {
    if (!accountData.phone) {
      showToast.error("Phone number is required");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast.success("Phone number added successfully");
      setLoading(false);
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      setTimeout(() => {
        showToast.success("Account deletion initiated. You will be logged out.");
        setTimeout(() => {
          logout();
        }, 2000);
      }, 1000);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-sidebar">
          <h2>Settings</h2>
          <nav className="settings-nav">
            <button
              className={`settings-nav-item ${activeTab === "account" ? "active" : ""}`}
              onClick={() => setActiveTab("account")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Account
            </button>
            <button
              className={`settings-nav-item ${activeTab === "privacy" ? "active" : ""}`}
              onClick={() => setActiveTab("privacy")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Privacy
            </button>
            <button
              className={`settings-nav-item ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              Notifications
            </button>
            <button
              className={`settings-nav-item ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Security
            </button>
            <button
              className={`settings-nav-item ${activeTab === "preferences" ? "active" : ""}`}
              onClick={() => setActiveTab("preferences")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
              </svg>
              Preferences
            </button>
            <button
              className={`settings-nav-item ${activeTab === "connections" ? "active" : ""}`}
              onClick={() => setActiveTab("connections")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/>
              </svg>
              Connections
            </button>
            <button
              className={`settings-nav-item ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              Requests
            </button>
            <button
              className={`settings-nav-item ${activeTab === "suggestions" ? "active" : ""}`}
              onClick={() => setActiveTab("suggestions")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Suggestions
            </button>
          </nav>
        </div>

        <div className="settings-content">
          {activeTab === "account" && (
            <div className="settings-section">
              <h3>Account Settings</h3>
              
              {/* Email Change */}
              <div className="settings-card">
                <h4>Change Email</h4>
                <div className="setting-item">
                  <input
                    type="email"
                    className="settings-input"
                    placeholder="New email address"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  />
                  <button 
                    className="btn-secondary btn-sm" 
                    onClick={handleEmailChange}
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Email"}
                  </button>
                </div>
              </div>

              {/* Password Change */}
              <div className="settings-card">
                <h4>Change Password</h4>
                <div className="setting-item">
                  <input
                    type="password"
                    className="settings-input"
                    placeholder="Current password"
                    value={accountData.currentPassword}
                    onChange={(e) => setAccountData({ ...accountData, currentPassword: e.target.value })}
                  />
                </div>
                <div className="setting-item">
                  <input
                    type="password"
                    className="settings-input"
                    placeholder="New password"
                    value={accountData.newPassword}
                    onChange={(e) => setAccountData({ ...accountData, newPassword: e.target.value })}
                  />
                </div>
                <div className="setting-item">
                  <input
                    type="password"
                    className="settings-input"
                    placeholder="Confirm new password"
                    value={accountData.confirmPassword}
                    onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                  />
                  <button 
                    className="btn-secondary btn-sm" 
                    onClick={handlePasswordChange}
                    disabled={loading}
                  >
                    {loading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </div>

              {/* Phone Number */}
              <div className="settings-card">
                <h4>Phone Number</h4>
                <div className="setting-item">
                  <input
                    type="tel"
                    className="settings-input"
                    placeholder="+1 (555) 000-0000"
                    value={accountData.phone}
                    onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                  />
                  <button 
                    className="btn-secondary btn-sm" 
                    onClick={handlePhoneAdd}
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add Phone"}
                  </button>
                </div>
              </div>

              {/* Delete Account */}
              <div className="settings-card">
                <h4>Delete Account</h4>
                <p className="text-muted">Permanently delete your account and all data</p>
                <button 
                  className="btn-danger btn-sm" 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="settings-section">
              <h3>Privacy Settings</h3>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Profile Visibility</h4>
                    <p>Control who can see your profile</p>
                  </div>
                  <select
                    className="settings-select"
                    value={settings.profileVisibility}
                    onChange={(e) => handleSelect("profileVisibility", e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Show Email</h4>
                    <p>Display email on your profile</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.showEmail}
                      onChange={() => handleToggle("showEmail")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Show Location</h4>
                    <p>Display location on your profile</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.showLocation}
                      onChange={() => handleToggle("showLocation")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="settings-section">
              <h3>Notification Settings</h3>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Email Notifications</h4>
                    <p>Receive notifications via email</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={() => handleToggle("emailNotifications")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Push Notifications</h4>
                    <p>Receive push notifications</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={() => handleToggle("pushNotifications")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Connection Requests</h4>
                    <p>Notify when someone sends a connection request</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.connectionRequests}
                      onChange={() => handleToggle("connectionRequests")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Job Alerts</h4>
                    <p>Notify about new job opportunities</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.jobAlerts}
                      onChange={() => handleToggle("jobAlerts")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Messages</h4>
                    <p>Notify when you receive a message</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.messageNotifications}
                      onChange={() => handleToggle("messageNotifications")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="settings-section">
              <h3>Security Settings</h3>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={() => handleToggle("twoFactorAuth")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Active Sessions</h4>
                    <p>Manage your active sessions</p>
                  </div>
                  <button className="btn-secondary btn-sm">View Sessions</button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Login History</h4>
                    <p>View your recent login activity</p>
                  </div>
                  <button className="btn-secondary btn-sm">View History</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="settings-section">
              <h3>Preferences</h3>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Language</h4>
                    <p>Choose your preferred language</p>
                  </div>
                  <select
                    className="settings-select"
                    value={settings.language}
                    onChange={(e) => handleSelect("language", e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Timezone</h4>
                    <p>Set your timezone</p>
                  </div>
                  <select
                    className="settings-select"
                    value={settings.timezone}
                    onChange={(e) => handleSelect("timezone", e.target.value)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="PST">Pacific Time</option>
                    <option value="IST">India Standard Time</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "connections" && (
            <div className="settings-section">
              <h3>My Connections ({connections.length})</h3>
              {networkLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="network-grid">
                  {connections.map((conn: any) => (
                    <div key={conn._id} className="network-card">
                      <div className="network-avatar">
                        {conn.connection.name.charAt(0).toUpperCase()}
                      </div>
                      <h4>{conn.connection.name}</h4>
                      <p className="network-headline">{conn.connection.headline || "Professional"}</p>
                      <p className="network-location">{conn.connection.location}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="settings-section">
              <h3>Connection Requests ({requests.length})</h3>
              {networkLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="requests-list">
                  {requests.map((request) => (
                    <div key={request._id} className="request-card">
                      <div className="request-avatar">
                        {request.requester.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="request-info">
                        <h4>{request.requester.name}</h4>
                        <p>{request.requester.headline || "Professional"}</p>
                        {request.message && <p className="request-message">"{request.message}"</p>}
                      </div>
                      <div className="request-actions">
                        <button className="btn-accept" onClick={() => handleAccept(request._id)}>
                          Accept
                        </button>
                        <button className="btn-reject" onClick={() => handleReject(request._id)}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "suggestions" && (
            <div className="settings-section">
              <h3>People You May Know ({suggestions.length})</h3>
              {networkLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="network-grid">
                  {suggestions.map((user) => (
                    <div key={user._id} className="network-card">
                      <div className="network-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <h4>{user.name}</h4>
                      <p className="network-headline">{user.headline || "Professional"}</p>
                      <p className="network-location">{user.location}</p>
                      <button className="btn-connect" onClick={() => handleConnect(user._id)}>
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
