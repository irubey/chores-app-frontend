import {
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError, ApiErrorType, NetworkError } from "./errors/apiErrors";

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

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
  originalRequest: InternalAxiosRequestConfig
): Promise<AxiosRequestConfig> {
  // Prevent infinite refresh loops
  if (originalRequest?.url?.includes("/auth/refresh-token")) {
    throw new ApiError(
      "Authentication refresh failed",
      ApiErrorType.UNAUTHORIZED,
      401,
      { code: "AUTH_REFRESH_FAILED" }
    );
  }

  try {
    if (!isRefreshing) {
      isRefreshing = true;

      // Check for refresh token in cookies
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      if (!cookies.refreshToken) {
        throw new ApiError(
          "No refresh token available",
          ApiErrorType.UNAUTHORIZED,
          401,
          { code: "NO_REFRESH_TOKEN" }
        );
      }

      await axiosInstance.post("/auth/refresh-token", null, {
        withCredentials: true,
      });

      isRefreshing = false;
      onTokenRefreshed();
    }

    // Return the original request config for retry
    return originalRequest;
  } catch (refreshError) {
    isRefreshing = false;
    onRefreshError();
    throw new ApiError(
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
      const originalRequest = error.config as InternalAxiosRequestConfig;

      // Only handle 401s for token refresh, let apiUtils handle other errors
      if (error.response?.status === 401 && originalRequest) {
        try {
          // If we're already refreshing, queue this request
          if (isRefreshing) {
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
