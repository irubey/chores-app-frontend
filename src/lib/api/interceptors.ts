import {
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError, ApiErrorType, NetworkError } from "./errors/apiErrors";
import { logger } from "@/lib/api/logger";

// Extend InternalAxiosRequestConfig to include _retry
interface ExtendedInternalAxiosRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _refreshAttempts?: number;
}

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 1000; // 1 second minimum between refresh attempts

// Subscribe failed requests to be retried after token refresh
function subscribeTokenRefresh(cb: () => void) {
  refreshSubscribers.push(cb);
}

// Retry failed requests
function onTokenRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

// Reject all requests if refresh fails
function onRefreshError() {
  refreshSubscribers = [];
}

/**
 * Handles token refresh for 401 responses
 * Returns a promise that resolves with the original request config for retry
 */
async function handleTokenRefresh(
  axiosInstance: AxiosInstance,
  originalRequest: ExtendedInternalAxiosRequestConfig
): Promise<AxiosRequestConfig> {
  // Initialize refresh attempts counter
  originalRequest._refreshAttempts =
    (originalRequest._refreshAttempts || 0) + 1;

  // Prevent infinite refresh loops
  if (
    originalRequest?.url?.includes("/auth/refresh-token") ||
    originalRequest._retry ||
    originalRequest._refreshAttempts > 1
  ) {
    logger.debug("Skipping token refresh", {
      url: originalRequest.url,
      isRetry: originalRequest._retry,
      attempts: originalRequest._refreshAttempts,
    });
    throw new ApiError(
      "Authentication refresh failed",
      ApiErrorType.UNAUTHORIZED,
      401,
      { code: "AUTH_REFRESH_FAILED" }
    );
  }

  try {
    // Check if we've refreshed recently
    const now = Date.now();
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      logger.debug("Skipping refresh - too soon since last attempt", {
        timeSinceLastRefresh: now - lastRefreshTime,
      });
      throw new ApiError(
        "Too many refresh attempts",
        ApiErrorType.UNAUTHORIZED,
        401,
        { code: "REFRESH_RATE_LIMIT" }
      );
    }

    if (!isRefreshing) {
      isRefreshing = true;
      lastRefreshTime = now;

      // Check for refresh token in cookies
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      if (!cookies.auth_session) {
        isRefreshing = false;
        throw new ApiError(
          "No refresh token available",
          ApiErrorType.UNAUTHORIZED,
          401,
          { code: "NO_REFRESH_TOKEN" }
        );
      }

      logger.debug("Attempting token refresh");
      await axiosInstance.post("/auth/refresh-token", null, {
        withCredentials: true,
      });

      logger.debug("Token refresh successful");
      isRefreshing = false;
      onTokenRefreshed();
    }

    // Mark request as retried to prevent loops
    originalRequest._retry = true;
    return originalRequest;
  } catch (refreshError) {
    isRefreshing = false;
    onRefreshError();
    throw refreshError instanceof ApiError
      ? refreshError
      : new ApiError(
          "Authentication refresh failed",
          ApiErrorType.UNAUTHORIZED,
          401,
          { code: "AUTH_REFRESH_FAILED" }
        );
  }
}

/**
 * Handles network errors.
 */
function handleNetworkError(
  error: AxiosError,
  originalRequest: AxiosRequestConfig
): Promise<never> {
  return Promise.reject(new NetworkError("Network error. Please try again."));
}

/**
 * Handles API errors.
 */
function handleApiError(
  error: AxiosError,
  originalRequest: AxiosRequestConfig
): Promise<never> {
  const apiError = ApiError.fromHttpError(
    error.response?.status || 500,
    (error.response?.data as { message?: string })?.message,
    error.response?.data
  );

  return Promise.reject(apiError);
}

/**
 * Sets up Axios response interceptors.
 * Handles token refresh before apiUtils handles the final response/error.
 */
export function setupInterceptors(axiosInstance: AxiosInstance) {
  // Add request interceptor to ensure credentials are sent
  axiosInstance.interceptors.request.use(
    (config) => {
      config.withCredentials = true;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for token refresh
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest =
        error.config as ExtendedInternalAxiosRequestConfig;

      // Skip token refresh for auth endpoints or already retried requests
      if (
        !originalRequest ||
        originalRequest?.url?.startsWith("/auth/") ||
        originalRequest._retry
      ) {
        throw error;
      }

      // Only handle 401s for token refresh, let apiUtils handle other errors
      if (error.response?.status === 401) {
        try {
          // If we're already refreshing, queue this request
          if (isRefreshing) {
            logger.debug("Token refresh in progress, queueing request", {
              url: originalRequest.url,
            });
            return new Promise((resolve) => {
              subscribeTokenRefresh(() => {
                resolve(axiosInstance(originalRequest));
              });
            });
          }

          // Attempt token refresh and retry original request
          const retryConfig = await handleTokenRefresh(
            axiosInstance,
            originalRequest
          );
          return axiosInstance(retryConfig);
        } catch (refreshError) {
          // Let apiUtils handle the error transformation and logging
          throw refreshError;
        }
      }

      // Let apiUtils handle all other errors
      throw error;
    }
  );
}
