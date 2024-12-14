import axios, { AxiosRequestConfig } from "axios";
import { setupInterceptors } from "./interceptors";

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _isRefreshRequest?: boolean;
  _refreshAttempts?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const REFRESH_TIMEOUT = 5000; // 5 seconds for refresh requests

// Create a singleton axios instance
export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Create a separate instance for refresh token requests
export const refreshInstance = axios.create({
  baseURL: API_URL,
  timeout: REFRESH_TIMEOUT,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
  _isRefreshRequest: true, // Set this by default for all requests
} as ExtendedAxiosRequestConfig);

// Initialize interceptors after creating the axios instance
setupInterceptors(axiosInstance);
