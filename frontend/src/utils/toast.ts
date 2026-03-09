import toast from "react-hot-toast";

const toastConfig = {
  duration: 3000,
  style: {
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    color: "#f1f5f9",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "16px",
    fontSize: "0.9375rem",
    fontWeight: "500",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
  },
  success: {
    iconTheme: {
      primary: "#10b981",
      secondary: "#f1f5f9",
    },
  },
  error: {
    iconTheme: {
      primary: "#ef4444",
      secondary: "#f1f5f9",
    },
  },
};

export const showToast = {
  success: (message: string) => {
    toast.success(message, toastConfig);
  },
  error: (message: string) => {
    toast.error(message, toastConfig);
  },
  loading: (message: string) => {
    return toast.loading(message, toastConfig);
  },
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
};
