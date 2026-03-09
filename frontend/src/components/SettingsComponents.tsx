import React from "react";

interface SettingItemProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingItem: React.FC<SettingItemProps> = ({ title, description, children }) => (
  <div className="setting-item">
    <div className="setting-info">
      <h4>{title}</h4>
      {description && <p>{description}</p>}
    </div>
    {children}
  </div>
);

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled }) => (
  <label className="toggle">
    <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
    <span className="toggle-slider"></span>
  </label>
);

interface InputFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  type,
  placeholder,
  value,
  onChange,
  disabled,
  error,
  label,
  required,
}) => (
  <div className="input-field-wrapper">
    {label && (
      <label className="input-label">
        {label} {required && <span className="required">*</span>}
      </label>
    )}
    <input
      type={type}
      className={`settings-input ${error ? 'input-error' : ''}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
    {error && <span className="error-message">{error}</span>}
  </div>
);

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  value,
  onChange,
  options,
  disabled,
}) => (
  <select
    className="settings-select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

interface ButtonProps {
  onClick: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  loading,
  variant = "secondary",
  children,
  disabled,
  fullWidth,
}) => (
  <button
    className={`btn-${variant} btn-sm ${fullWidth ? 'btn-full-width' : ''}`}
    onClick={onClick}
    disabled={loading || disabled}
  >
    {loading ? (
      <span className="btn-loading">
        <span className="spinner"></span> Processing...
      </span>
    ) : children}
  </button>
);

interface SettingsCardProps {
  title?: string;
  children: React.ReactNode;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ title, children }) => (
  <div className="settings-card">
    {title && <h4>{title}</h4>}
    {children}
  </div>
);
