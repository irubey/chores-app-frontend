import axios from "axios";
import { setupInterceptors } from "./interceptors";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const REFRESH_TIMEOUT = 5000; // 5 seconds for refresh requests

// Create a singleton axios instance
export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Required for cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: DEFAULT_TIMEOUT,
});

// Create a separate instance for refresh token requests
export const refreshInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: REFRESH_TIMEOUT,
});

// Initialize interceptors after creating the axios instance
setupInterceptors(axiosInstance);
