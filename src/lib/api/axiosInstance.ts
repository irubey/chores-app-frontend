import axios from "axios";
import { setupInterceptors } from "./interceptors";
import { logger } from "./logger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

logger.debug("Configuring axios instance", {
  baseURL: API_URL,
});

// Create a singleton axios instance
export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Required for cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // Timeout after 10 seconds
  timeout: 10000,
});

// Initialize interceptors after creating the axios instance
setupInterceptors(axiosInstance);
