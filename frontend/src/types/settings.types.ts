export interface Preferences {
  jobAlerts: boolean;
  autoSave: boolean;
}

export interface Notifications {
  applicationUpdates: boolean;
  newsletters: boolean;
}

export interface AccountSettings {
  preferences: Preferences;
  notifications: Notifications;
}
