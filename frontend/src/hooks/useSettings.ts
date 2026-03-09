import { useState, useCallback } from "react";
import { showToast } from "../utils/toast";
import { userAPI } from "../api/user.api";

interface SettingsState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  connectionRequests: boolean;
  jobAlerts: boolean;
  messageNotifications: boolean;
  profileVisibility: "public" | "connections" | "private";
  showEmail: boolean;
  showLocation: boolean;
  twoFactorAuth: boolean;
  language: string;
  timezone: string;
}

interface AccountData {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  phone: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsState>({
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

  const [loading, setLoading] = useState(false);

  const updateSetting = useCallback(async (key: keyof SettingsState, value: any) => {
    const prevValue = settings[key];
    try {
      setSettings((prev) => ({ ...prev, [key]: value }));
      await userAPI.updateSettings({ [key]: value });
      showToast.success("Setting updated successfully");
    } catch (error) {
      showToast.error("Failed to update setting");
      setSettings((prev) => ({ ...prev, [key]: prevValue }));
    }
  }, [settings]);

  const toggleSetting = useCallback((key: keyof SettingsState) => {
    const currentValue = settings[key];
    updateSetting(key, !currentValue);
  }, [settings, updateSetting]);

  return { settings, loading, updateSetting, toggleSetting };
};

export const useAccountSettings = () => {
  const [accountData, setAccountData] = useState<AccountData>({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    phone: "",
  });

  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    email: false,
    password: false,
    phone: false,
    delete: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain a lowercase letter";
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain an uppercase letter";
    if (!/(?=.*\d)/.test(password)) return "Password must contain a number";
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) return "Phone number is required";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) return "Phone number must be at least 10 digits";
    return null;
  };

  const updateEmail = useCallback(async (email: string) => {
    const error = validateEmail(email);
    if (error) {
      setErrors((prev) => ({ ...prev, email: error }));
      showToast.error(error);
      return false;
    }

    setErrors((prev) => ({ ...prev, email: "" }));
    setLoading((prev) => ({ ...prev, email: true }));

    try {
      await userAPI.updateEmail(email);
      showToast.success("Email updated successfully");
      setAccountData((prev) => ({ ...prev, email: "" }));
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update email";
      setErrors((prev) => ({ ...prev, email: message }));
      showToast.error(message);
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, email: false }));
    }
  }, []);

  const updatePassword = useCallback(async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    const newErrors: { [key: string]: string } = {};

    if (!currentPassword) newErrors.currentPassword = "Current password is required";
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) newErrors.newPassword = passwordError;
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast.error(Object.values(newErrors)[0]);
      return false;
    }

    setErrors({});
    setLoading((prev) => ({ ...prev, password: true }));

    try {
      await userAPI.updatePassword(currentPassword, newPassword);
      showToast.success("Password updated successfully");
      setAccountData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update password";
      setErrors({ currentPassword: message });
      showToast.error(message);
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, password: false }));
    }
  }, []);

  const addPhone = useCallback(async (phone: string) => {
    const error = validatePhone(phone);
    if (error) {
      setErrors((prev) => ({ ...prev, phone: error }));
      showToast.error(error);
      return false;
    }

    setErrors((prev) => ({ ...prev, phone: "" }));
    setLoading((prev) => ({ ...prev, phone: true }));

    try {
      await userAPI.updatePhone(phone);
      showToast.success("Phone number updated successfully");
      setAccountData((prev) => ({ ...prev, phone: "" }));
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update phone number";
      setErrors((prev) => ({ ...prev, phone: message }));
      showToast.error(message);
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, phone: false }));
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    const confirmed = window.confirm(
      "⚠️ Delete Account?\n\nThis will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you absolutely sure?"
    );
    if (!confirmed) return false;

    const userInput = prompt('Type "DELETE" to confirm account deletion:');
    if (userInput !== "DELETE") {
      showToast.error("Account deletion cancelled");
      return false;
    }

    setLoading((prev) => ({ ...prev, delete: true }));

    try {
      await userAPI.deleteAccount();
      showToast.success("Account deleted successfully");
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "/signin";
      }, 1500);
      return true;
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Failed to delete account");
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
    }
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  return {
    accountData,
    setAccountData,
    loading,
    errors,
    updateEmail,
    updatePassword,
    addPhone,
    deleteAccount,
    clearError,
  };
};
