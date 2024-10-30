import {
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
  AxiosInstance,
} from "axios";
import { tokenService } from "./services/tokenService";
import { ApiError, NetworkError } from "./errors";
import { logger } from "./logger";

/**
 * Enhances RetryableAxiosRequestConfig with optional retry flag.
 */
export interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Handles network errors.
 * @param error - The Axios error.
 * @param originalRequest - The original Axios request config.
 * @returns A promise rejection with a NetworkError.
 */
function handleNetworkError(
  error: AxiosError,
  originalRequest: RetryableAxiosRequestConfig
): Promise<never> {
  logger.error(`Network Error: ${error.message}`);
  return Promise.reject(new NetworkError("Network error. Please try again."));
}

/**
 * Handles API errors.
 * @param error - The Axios error.
 * @param originalRequest - The original Axios request config.
 * @returns A promise rejection with an ApiError.
 */
function handleApiError(
  error: AxiosError,
  originalRequest: RetryableAxiosRequestConfig
): Promise<never> {
  const apiError = new ApiError(
    (error.response?.data as { message?: string })?.message || "API Error",
    error.response?.status || 500,
    error.response?.data
  );
  logger.error(`API Error: ${apiError.message}`);
  return Promise.reject(apiError);
}

/**
 * Sets up Axios response interceptors.
 * @param axiosInstance - The Axios instance to attach interceptors to.
 */
export function setupInterceptors(axiosInstance: AxiosInstance) {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableAxiosRequestConfig;

      if (!error.response) {
        return handleNetworkError(error, originalRequest);
      }

      if (
        error.response.status === 401 &&
        !shouldSkipTokenRefresh(originalRequest)
      ) {
        try {
          return await tokenService.handle401Error(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      return handleApiError(error, originalRequest);
    }
  );
}

/**
 * Determines whether token refresh should be skipped for specific endpoints.
 * @param request - The original Axios request config.
 * @returns Boolean indicating whether to skip token refresh.
 */
export function shouldSkipTokenRefresh(
  request: RetryableAxiosRequestConfig
): boolean {
  const skipRefreshEndpoints = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh-token",
  ];
  return skipRefreshEndpoints.some((endpoint) =>
    request.url?.includes(endpoint)
  );
}
