import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { ApiError, ApiErrorType } from "./errors/apiErrors";
import { isPublicRoute } from "@/lib/constants/routes";
import { logger } from "./logger";

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

// Maximum number of retry attempts for token refresh
const MAX_RETRY_ATTEMPTS = 3;

// Queue to hold pending requests during token refresh
interface QueuedRequest {
  config: ExtendedAxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

let requestQueue: QueuedRequest[] = [];
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

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
 * Check if auth session cookie exists
 */
function hasAuthCookies(): boolean {
  return document.cookie.includes("auth_session=");
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
        hasCookies: hasAuthCookies(),
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
    (response) => {
      logger.debug("API Response Success", {
        url: response.config.url,
        status: response.status,
        timestamp: new Date().toISOString(),
      });
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as ExtendedAxiosRequestConfig;

      if (!originalRequest) {
        logger.error("No original request found in error", { error });
        return Promise.reject(error);
      }

      // Check if we have auth cookies and should attempt refresh
      const hasCookies = hasAuthCookies();

      // Conditions to determine if the error should trigger a token refresh
      const shouldAttemptRefresh =
        error.response?.status === 401 &&
        !originalRequest._isRefreshRequest &&
        !isPublicRoute(originalRequest.url || "") &&
        hasCookies &&
        (originalRequest._refreshAttempts || 0) < MAX_RETRY_ATTEMPTS;

      if (!shouldAttemptRefresh) {
        // Handle specific 401 errors that should trigger auth error event
        if (
          error.response?.status === 401 &&
          originalRequest.url &&
          !isPublicRoute(originalRequest.url) &&
          !originalRequest.url.startsWith("/auth/") &&
          !originalRequest._isRefreshRequest
        ) {
          emitAuthError(
            new ApiError(
              "Authentication failed",
              ApiErrorType.UNAUTHORIZED,
              401,
              { code: "AUTH_FAILED" }
            )
          );
        }
        return Promise.reject(error);
      }

      // Increment refresh attempts
      originalRequest._refreshAttempts =
        (originalRequest._refreshAttempts || 0) + 1;

      // If refresh is in progress, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          requestQueue.push({
            config: originalRequest,
            resolve,
            reject,
          });
        });
      }

      // Start new refresh process
      try {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            logger.debug("Attempting to refresh token...");
            await axiosInstance.post("/auth/refresh-token", {}, {
              withCredentials: true,
              headers: {
                "Content-Type": "application/json",
              },
            } as ExtendedAxiosRequestConfig);
            logger.debug("Token refresh successful");
          } catch (refreshError) {
            logger.error("Token refresh failed", { refreshError });
            emitAuthError(
              new ApiError(
                "Token refresh failed",
                ApiErrorType.UNAUTHORIZED,
                401,
                { code: "AUTH_REFRESH_FAILED" }
              )
            );
            throw refreshError;
          } finally {
            await processQueue(axiosInstance);
            isRefreshing = false;
            refreshPromise = null;
          }
        })();

        await refreshPromise;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Clear queue and reject all pending requests
        requestQueue.forEach(({ reject }) => reject(refreshError));
        requestQueue = [];
        return Promise.reject(refreshError);
      }
    }
  );
}
