import {
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
  AxiosInstance,
} from "axios";
import { ApiError, NetworkError } from "./errors";
import { logger } from "./logger";

/**
 * Handles network errors.
 */
function handleNetworkError(
  error: AxiosError,
  originalRequest: AxiosRequestConfig
): Promise<never> {
  logger.error(`Network Error: ${error.message}`);
  return Promise.reject(new NetworkError("Network error. Please try again."));
}

/**
 * Handles API errors.
 */
function handleApiError(
  error: AxiosError,
  originalRequest: AxiosRequestConfig
): Promise<never> {
  logger.debug("Interceptor handling API error", {
    originalStatus: error.response?.status,
    originalUrl: originalRequest.url,
    originalMethod: originalRequest.method,
  });

  const apiError = ApiError.fromHttpError(
    error.response?.status || 500,
    (error.response?.data as { message?: string })?.message,
    error.response?.data
  );

  logger.debug("Interceptor created ApiError", {
    transformedError: {
      type: apiError.type,
      status: apiError.status,
      message: apiError.message,
    },
  });

  return Promise.reject(apiError);
}

/**
 * Sets up Axios response interceptors.
 */
export function setupInterceptors(axiosInstance: AxiosInstance) {
  // Add request interceptor to ensure credentials are sent
  axiosInstance.interceptors.request.use(
    (config) => {
      config.withCredentials = true;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig;

      if (!error.response) {
        return handleNetworkError(error, originalRequest);
      }

      return handleApiError(error, originalRequest);
    }
  );
}
