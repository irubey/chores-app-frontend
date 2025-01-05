import axios, {
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from "axios";
import { setupInterceptors } from "./interceptors";
import { logger } from "./logger";

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _isRefreshRequest?: boolean;
  _refreshAttempts?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const REFRESH_TIMEOUT = 5000; // 5 seconds for refresh requests

// Token refresh configuration
const TOKEN_REFRESH_THRESHOLD = 10; // seconds before expiry to refresh
let lastTokenRefresh = 0;
const MIN_REFRESH_INTERVAL = 5000; // Minimum 5s between refresh attempts

// Function to check if we should attempt preemptive refresh
const shouldAttemptPreemptiveRefresh = () => {
  const now = Date.now();
  if (now - lastTokenRefresh < MIN_REFRESH_INTERVAL) {
    return false;
  }
  return true;
};

const preemptiveRefreshInterceptor = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  const extendedConfig = config as ExtendedAxiosRequestConfig;
  if (extendedConfig._isRefreshRequest || config.url?.startsWith("/auth/")) {
    return config;
  }

  if (shouldAttemptPreemptiveRefresh()) {
    try {
      await refreshInstance.post("/auth/refresh-token");
      lastTokenRefresh = Date.now();
      logger.debug("Preemptive token refresh successful");
    } catch (error) {
      logger.debug("Preemptive token refresh failed", { error });
    }
  }

  return config;
};

// Create a singleton axios instance
export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: new AxiosHeaders({
    Accept: "application/json",
    "Content-Type": "application/json",
  }),
  withCredentials: true,
});

// Create refresh instance with proper typing
const refreshConfig: AxiosRequestConfig & { _isRefreshRequest: boolean } = {
  baseURL: API_URL,
  timeout: REFRESH_TIMEOUT,
  headers: new AxiosHeaders({
    Accept: "application/json",
    "Content-Type": "application/json",
  }),
  withCredentials: true,
  _isRefreshRequest: true,
};

export const refreshInstance = axios.create(refreshConfig);

// Add preemptive refresh interceptor before other interceptors
axiosInstance.interceptors.request.use(preemptiveRefreshInterceptor);

// Apply interceptors to both instances
setupInterceptors(axiosInstance);
setupInterceptors(refreshInstance);
