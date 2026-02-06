// src/services/error.ts
import axios, { AxiosError } from "axios";

/**
 * Standard error shape used across the app
 * This keeps UI + API behavior consistent
 */
export type ApiError = {
  message: string;
  status?: number;
  code?: string;
};

/**
 * Normalize any error (Axios / Network / Unknown)
 * into a clean, predictable format
 */
export function handleApiError(error: unknown): ApiError {
  // Axios error (most common)
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    return {
      message:
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Something went wrong",
      status: axiosError.response?.status,
      code: axiosError.code,
    };
  }

  // JS Error (rare, but possible)
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // Fallback (very rare)
  return {
    message: "Unexpected error occurred",
  };
}
