import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettings, useAccountSettings } from "../../hooks/useSettings";
import { connectionAPI } from "../../api/connection.api";
import { showToast } from "../../utils/toast";
import { Connection, User } from "../../types";
import {
  SettingItem,
  ToggleSwitch,
  InputField,
  SelectField,
  Button,
  SettingsCard,
} from "../../components/SettingsComponents";
import "./Settings.css";

type TabType = "account" | "privacy" | "notifications" | "security" | "preferences" | "connections" | "requests" | "suggestions";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("account");
  const { settings, loading: settingsLoading, updateSetting, toggleSetting } = useSettings();
  const accountSettings = useAccountSettings();
  const { accountData, setAccountData } = accountSettings;

  // Network state
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);

  useEffect(() => {
    if (["connections", "requests", "suggestions"].includes(activeTab)) {
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div className="settings-section">
            <h3>Account Settings</h3>
            <p className="section-description">Manage your account information and security</p>

            <SettingsCard title="Email Address">
              <p className="card-description">Update your primary email address</p>
              <div className="form-group">
                <InputField
                  type="email"
                  placeholder="Enter new email address"
                  value={accountData.email}
                  onChange={(value) => {
                    setAccountData({ ...accountData, email: value });
                    accountSettings.clearError('email');
                  }}
                  disabled={accountSettings.loading.email}
                  error={accountSettings.errors.email}
                  label="New Email"
                  required
                />
                <Button 
                  onClick={() => accountSettings.updateEmail(accountData.email)} 
                  loading={accountSettings.loading.email}
                  variant="primary"
                  fullWidth
                >
                  Update Email
                </Button>
              </div>
            </SettingsCard>

            <SettingsCard title="Password">
              <p className="card-description">Change your password to keep your account secure</p>
              <div className="form-group">
                <InputField
                  type="password"
                  placeholder="Enter current password"
                  value={accountData.currentPassword}
                  onChange={(value) => {
                    setAccountData({ ...accountData, currentPassword: value });
                    accountSettings.clearError('currentPassword');
                  }}
                  disabled={accountSettings.loading.password}
                  error={accountSettings.errors.currentPassword}
                  label="Current Password"
                  required
                />
                <InputField
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  value={accountData.newPassword}
                  onChange={(value) => {
                    setAccountData({ ...accountData, newPassword: value });
                    accountSettings.clearError('newPassword');
                  }}
                  disabled={accountSettings.loading.password}
                  error={accountSettings.errors.newPassword}
                  label="New Password"
                  required
                />
                <InputField
                  type="password"
                  placeholder="Confirm new password"
                  value={accountData.confirmPassword}
                  onChange={(value) => {
                    setAccountData({ ...accountData, confirmPassword: value });
                    accountSettings.clearError('confirmPassword');
                  }}
                  disabled={accountSettings.loading.password}
                  error={accountSettings.errors.confirmPassword}
                  label="Confirm Password"
                  required
                />
                <div className="password-requirements">
                  <p className="requirements-title">Password must contain:</p>
                  <ul>
                    <li className={accountData.newPassword.length >= 8 ? 'valid' : ''}>At least 8 characters</li>
                    <li className={/[a-z]/.test(accountData.newPassword) ? 'valid' : ''}>One lowercase letter</li>
                    <li className={/[A-Z]/.test(accountData.newPassword) ? 'valid' : ''}>One uppercase letter</li>
                    <li className={/\d/.test(accountData.newPassword) ? 'valid' : ''}>One number</li>
                  </ul>
                </div>
                <Button
                  onClick={() => accountSettings.updatePassword(
                    accountData.currentPassword, 
                    accountData.newPassword, 
                    accountData.confirmPassword
                  )}
                  loading={accountSettings.loading.password}
                  variant="primary"
                  fullWidth
                >
                  Change Password
                </Button>
              </div>
            </SettingsCard>

            <SettingsCard title="Phone Number">
              <p className="card-description">Add a phone number for account recovery</p>
              <div className="form-group">
                <InputField
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={accountData.phone}
                  onChange={(value) => {
                    setAccountData({ ...accountData, phone: value });
                    accountSettings.clearError('phone');
                  }}
                  disabled={accountSettings.loading.phone}
                  error={accountSettings.errors.phone}
                  label="Phone Number"
                  required
                />
                <Button 
                  onClick={() => accountSettings.addPhone(accountData.phone)} 
                  loading={accountSettings.loading.phone}
                  variant="primary"
                  fullWidth
                >
                  Update Phone
                </Button>
              </div>
            </SettingsCard>

            <SettingsCard title="Danger Zone">
              <div className="danger-zone">
                <div className="danger-info">
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <Button 
                  onClick={accountSettings.deleteAccount} 
                  loading={accountSettings.loading.delete} 
                  variant="danger"
                >
                  Delete Account
                </Button>
              </div>
            </SettingsCard>
          </div>
        );

      case "privacy":
        return (
          <div className="settings-section">
            <h3>Privacy Settings</h3>
            <SettingsCard>
              <SettingItem title="Profile Visibility" description="Control who can see your profile">
                <SelectField
                  value={settings.profileVisibility}
                  onChange={(value) => updateSetting("profileVisibility", value)}
                  options={[
                    { value: "public", label: "Public" },
                    { value: "connections", label: "Connections Only" },
                    { value: "private", label: "Private" },
                  ]}
                  disabled={settingsLoading}
                />
              </SettingItem>
              <SettingItem title="Show Email" description="Display email on your profile">
                <ToggleSwitch
                  checked={settings.showEmail}
                  onChange={() => toggleSetting("showEmail")}
                  disabled={settingsLoading}
                />
              </SettingItem>
              <SettingItem title="Show Location" description="Display location on your profile">
                <ToggleSwitch
                  checked={settings.showLocation}
                  onChange={() => toggleSetting("showLocation")}
                  disabled={settingsLoading}
                />
              </SettingItem>
            </SettingsCard>
          </div>
        );

      case "notifications":
        return (
          <div className="settings-section">
            <h3>Notification Settings</h3>
            <SettingsCard>
              <SettingItem title="Email Notifications" description="Receive notifications via email">
                <ToggleSwitch
                  checked={settings.emailNotifications}
                  onChange={() => toggleSetting("emailNotifications")}
                  disabled={settingsLoading}
                />
              </SettingItem>
              <SettingItem title="Push Notifications" description="Receive push notifications">
                <ToggleSwitch
                  checked={settings.pushNotifications}
                  onChange={() => toggleSetting("pushNotifications")}
                  disabled={settingsLoading}
                />
              </SettingItem>
              <SettingItem title="Connection Requests" description="Notify when someone sends a connection request">
                <ToggleSwitch
                  checked={settings.connectionRequests}
                  onChange={() => toggleSetting("connectionRequests")}
                  disabled={settingsLoading}
                />
              </SettingItem>
              <SettingItem title="Job Alerts" description="Notify about new job opportunities">
                <ToggleSwitch
                  checked={settings.jobAlerts}
                  onChange={() => toggleSetting("jobAlerts")}
                  disabled={settingsLoading}
                />
              </SettingItem>
              <SettingItem title="Messages" description="Notify when you receive a message">
                <ToggleSwitch
                  checked={settings.messageNotifications}
                  onChange={() => toggleSetting("messageNotifications")}
                  disabled={settingsLoading}
                />
              </SettingItem>
            </SettingsCard>
          </div>
        );

      case "security":
        return (
          <div className="settings-section">
            <h3>Security Settings</h3>
            <SettingsCard>
              <SettingItem title="Two-Factor Authentication" description="Add an extra layer of security">
                <ToggleSwitch
                  checked={settings.twoFactorAuth}
                  onChange={() => toggleSetting("twoFactorAuth")}
                  disabled={settingsLoading}
                />
              </SettingItem>
              <SettingItem title="Active Sessions" description="Manage your active sessions">
                <Button onClick={() => showToast.info("Feature coming soon")}>View Sessions</Button>
              </SettingItem>
              <SettingItem title="Login History" description="View your recent login activity">
                <Button onClick={() => showToast.info("Feature coming soon")}>View History</Button>
              </SettingItem>
            </SettingsCard>
          </div>
        );

      case "preferences":
        return (
          <div className="settings-section">
            <h3>Preferences</h3>
            <SettingsCard>
              <SettingItem title="Language" description="Choose your preferred language">
                <SelectField
                  value={settings.language}
                  onChange={(value) => updateSetting("language", value)}
                  options={[
                    { value: "en", label: "English" },
                    { value: "es", label: "Spanish" },
                    { value: "fr", label: "French" },
                    { value: "de", label: "German" },
                  ]}
                  disabled={settingsLoading}
                />
              </SettingItem>
              <SettingItem title="Timezone" description="Set your timezone">
                <SelectField
                  value={settings.timezone}
                  onChange={(value) => updateSetting("timezone", value)}
                  options={[
                    { value: "UTC", label: "UTC" },
                    { value: "EST", label: "Eastern Time" },
                    { value: "PST", label: "Pacific Time" },
                    { value: "IST", label: "India Standard Time" },
                  ]}
                  disabled={settingsLoading}
                />
              </SettingItem>
            </SettingsCard>
          </div>
        );

      case "connections":
        return (
          <div className="settings-section">
            <h3>My Connections ({connections.length})</h3>
            {networkLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="network-grid">
                {connections.map((conn: any) => (
                  <div key={conn._id} className="network-card">
                    <div className="network-avatar">{conn.connection.name.charAt(0).toUpperCase()}</div>
                    <h4>{conn.connection.name}</h4>
                    <p className="network-headline">{conn.connection.headline || "Professional"}</p>
                    <p className="network-location">{conn.connection.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "requests":
        return (
          <div className="settings-section">
            <h3>Connection Requests ({requests.length})</h3>
            {networkLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="requests-list">
                {requests.map((request) => (
                  <div key={request._id} className="request-card">
                    <div className="request-avatar">{request.requester.name.charAt(0).toUpperCase()}</div>
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
        );

      case "suggestions":
        return (
          <div className="settings-section">
            <h3>People You May Know ({suggestions.length})</h3>
            {networkLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="network-grid">
                {suggestions.map((user) => (
                  <div key={user._id} className="network-card">
                    <div className="network-avatar">{user.name.charAt(0).toUpperCase()}</div>
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-sidebar">
          <h2>Settings</h2>
          <nav className="settings-nav">
            {[
              { id: "account", label: "Account", icon: "👤" },
              { id: "privacy", label: "Privacy", icon: "🔒" },
              { id: "notifications", label: "Notifications", icon: "🔔" },
              { id: "security", label: "Security", icon: "🛡️" },
              { id: "preferences", label: "Preferences", icon: "⚙️" },
              { id: "connections", label: "Connections", icon: "🤝" },
              { id: "requests", label: "Requests", icon: "📨" },
              { id: "suggestions", label: "Suggestions", icon: "💡" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id as TabType)}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-content">{renderTabContent()}</div>
      </div>
    </div>
  );
}
