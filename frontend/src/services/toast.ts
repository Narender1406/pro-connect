import toast from "react-hot-toast";
import { ApiError } from "./error";

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (error: ApiError | string) => {
  if (typeof error === "string") {
    toast.error(error);
  } else {
    toast.error(error.message || "Something went wrong");
  }
};
