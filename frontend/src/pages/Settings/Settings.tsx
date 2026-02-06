import { useState } from "react";
import {
  FiUser,
  FiBell,
  FiShield,
  FiBriefcase,
  FiHelpCircle,
} from "react-icons/fi";

import AccountSecurity from "../../components/settings/AccountSecurity";
import AccountPreferences from "../../components/settings/AccountPreferences";
import NotificationsSettings from "../../components/settings/NotificationSettings";
import ApplicationsSettings from "../../components/settings/ApplicationSettings";

import "./Settings.css";

type TabKey =
  | "account"
  | "preferences"
  | "notifications"
  | "applications"
  | "support";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>("account");

  return (
    <div className="settings-page">
      {/* Sidebar */}
      <aside className="settings-sidebar">
        <h2 className="settings-title"></h2>

        <button
          className={`settings-tab ${
            activeTab === "account" ? "active" : ""
          }`}
          onClick={() => setActiveTab("account")}
        >
          <FiShield />
          Account & Security
        </button>

        <button
          className={`settings-tab ${
            activeTab === "preferences" ? "active" : ""
          }`}
          onClick={() => setActiveTab("preferences")}
        >
          <FiUser />
          Profile Preferences
        </button>

        <button
          className={`settings-tab ${
            activeTab === "notifications" ? "active" : ""
          }`}
          onClick={() => setActiveTab("notifications")}
        >
          <FiBell />
          Notifications
        </button>

        <button
          className={`settings-tab ${
            activeTab === "applications" ? "active" : ""
          }`}
          onClick={() => setActiveTab("applications")}
        >
          <FiBriefcase />
          My Applications
        </button>

        <button
          className={`settings-tab ${
            activeTab === "support" ? "active" : ""
          }`}
          onClick={() => setActiveTab("support")}
        >
          <FiHelpCircle />
          Help & Support
        </button>
      </aside>

      {/* Content */}
      <section className="settings-content">
        {activeTab === "account" && <AccountSecurity />}

        {activeTab === "preferences" && <AccountPreferences />}

        {activeTab === "notifications" && <NotificationsSettings />}

        {activeTab === "applications" && <ApplicationsSettings />}

        {activeTab === "support" && (
          <div className="settings-card">
            <h3>Need Further Assistance?</h3>
            <p>
              Can’t find what you’re looking for? Submit a support request and
              our team will help you.
            </p>
            <button className="primary-btn">Contact Support</button>
          </div>
        )}
      </section>
    </div>
  );
}
