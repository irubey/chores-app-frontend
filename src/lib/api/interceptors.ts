import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { ApiError, ApiErrorType } from "./errors/apiErrors";
import { isPublicRoute } from "@/lib/constants/routes";
import { logger } from "./logger";
import { refreshInstance } from "./axiosInstance";

// Custom event for auth failures
export const AUTH_ERROR_EVENT = "auth:error";
export const emitAuthError = (error: ApiError) => {
  window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT, { detail: error }));
};

// Extended types for request tracking
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _isRefreshRequest?: boolean;
  _refreshAttempts?: number;
}

// Configuration constants
const MAX_RETRY_ATTEMPTS = 3;

// Queue to hold pending requests during token refresh
interface QueuedRequest {
  config: ExtendedAxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

let requestQueue: QueuedRequest[] = [];
let isRefreshing = false;

/**
 * Process queued requests after token refresh
 * Handles each request individually to prevent a single failure from affecting others
 */
async function processQueue(axiosInstance: AxiosInstance): Promise<void> {
  const currentQueue = [...requestQueue];
  requestQueue = [];

  for (const { config, resolve, reject } of currentQueue) {
    try {
      const response = await axiosInstance(config);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  }
}

/**
 * Sets up Axios interceptors for handling authentication and token refresh
 */
export function setupInterceptors(axiosInstance: AxiosInstance) {
  // Prevent multiple interceptor setups
  if ((axiosInstance as any).__interceptorsInitialized) {
    return;
  }
  (axiosInstance as any).__interceptorsInitialized = true;

  // Request Interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const extendedConfig = config as ExtendedAxiosRequestConfig;

      logger.debug("API Request Details", {
        url: extendedConfig.url,
        method: extendedConfig.method,
        isRefreshRequest: extendedConfig._isRefreshRequest,
        timestamp: new Date().toISOString(),
      });

      // Ensure credentials (cookies) are included with every request
      extendedConfig.withCredentials = true;
      return extendedConfig;
    },
    (error) => {
      logger.error("Request Error", {
        error,
        timestamp: new Date().toISOString(),
      });
      return Promise.reject(error);
    }
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as ExtendedAxiosRequestConfig;

      if (!originalRequest) {
        logger.error("No original request found in error", { error });
        return Promise.reject(error);
      }

      // Determine if we should attempt refresh
      const shouldAttemptRefresh =
        error.response?.status === 401 &&
        !originalRequest._isRefreshRequest &&
        !isPublicRoute(originalRequest.url || "") &&
        (originalRequest._refreshAttempts || 0) < MAX_RETRY_ATTEMPTS;

      // For public routes or refresh requests, just reject
      if (
        isPublicRoute(originalRequest.url || "") ||
        originalRequest._isRefreshRequest
      ) {
        return Promise.reject(error);
      }

      // Handle 401s with potential refresh
      if (error.response?.status === 401) {
        // If we shouldn't attempt refresh, emit auth error
        if (!shouldAttemptRefresh) {
          emitAuthError(
            new ApiError(
              "Authentication failed",
              ApiErrorType.UNAUTHORIZED,
              401,
              { code: "AUTH_FAILED" }
            )
          );
          return Promise.reject(error);
        }

        // Attempt refresh
        try {
          if (isRefreshing) {
            // Queue the request if refresh is in progress
            return new Promise((resolve, reject) => {
              requestQueue.push({
                config: originalRequest,
                resolve,
                reject,
              });
            });
          }

          isRefreshing = true;

          // Just use the refreshInstance directly - it already has timeout configured
          await refreshInstance.post("/auth/refresh-token");

          // Reset refresh attempts on successful refresh
          originalRequest._refreshAttempts = 0;

          // Retry original request
          const response = await axiosInstance(originalRequest);
          await processQueue(axiosInstance);
          return response;
        } catch (refreshError) {
          // Increment attempts only on failure
          originalRequest._refreshAttempts =
            (originalRequest._refreshAttempts || 0) + 1;

          // Emit auth error only if we've exhausted all attempts
          if (originalRequest._refreshAttempts >= MAX_RETRY_ATTEMPTS) {
            emitAuthError(
              new ApiError(
                "Token refresh failed after maximum attempts",
                ApiErrorType.UNAUTHORIZED,
                401,
                { code: "AUTH_REFRESH_FAILED" }
              )
            );
          }

          // Clear and reject queue
          requestQueue.forEach(({ reject }) => reject(refreshError));
          requestQueue = [];
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // For non-401 errors, just reject
      return Promise.reject(error);
    }
  );
}
