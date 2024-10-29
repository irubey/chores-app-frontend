import { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";
import { axiosInstance } from "./axiosInstance";
import { tokenService } from "./services/tokenService";
import { ApiError, NetworkError } from "./errors";
import { logger } from "./logger";
import { retryWithExponentialBackoff } from "./retry";

interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export function setupInterceptors() {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    handleResponseError
  );
}

async function handleResponseError(error: AxiosError): Promise<any> {
  const originalRequest = error.config as RetryableAxiosRequestConfig;

  if (shouldSkipTokenRefresh(originalRequest)) {
    return handleApiError(error, originalRequest);
  }

  if (error.response?.status === 401 && !originalRequest._retry) {
    return tokenService.handle401Error(originalRequest);
  }

  if (error.response) {
    return handleApiError(error, originalRequest);
  } else if (error.request) {
    return handleNetworkError(error, originalRequest);
  }

  logger.error(`Request Error: ${error.message}`, {
    url: originalRequest.url,
    method: originalRequest.method,
  });
  return Promise.reject(error);
}

function shouldSkipTokenRefresh(request: RetryableAxiosRequestConfig): boolean {
  const skipRefreshEndpoints = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh-token",
  ];
  return skipRefreshEndpoints.some((endpoint) =>
    request.url?.includes(endpoint)
  );
}

function handleApiError(
  error: AxiosError,
  originalRequest: RetryableAxiosRequestConfig
): Promise<never> {
  const { status, data } = error.response as AxiosResponse<{
    message?: string;
    error?: string;
  }>;

  const errorMessage = data.message || data.error || "An error occurred";

  logger.error(`API Error: ${status} - ${errorMessage}`, {
    url: originalRequest.url,
    method: originalRequest.method,
    status,
  });

  return Promise.reject(new ApiError(errorMessage, status, data));
}

async function handleNetworkError(
  error: AxiosError,
  originalRequest: RetryableAxiosRequestConfig
): Promise<any> {
  logger.error("Network Error: No response received from server.", {
    url: originalRequest.url,
    method: originalRequest.method,
  });

  try {
    return await retryWithExponentialBackoff(() =>
      axiosInstance(originalRequest)
    );
  } catch (retryError) {
    return Promise.reject(
      new NetworkError(
        "Unable to connect to the server. Please check your internet connection."
      )
    );
  }
}
