import {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
} from "axios";
import { ApiError, ApiErrorType } from "./errors/apiErrors";
import { hasAuthSession } from "@/utils/cookieUtils";
import { isPublicRoute } from "@/lib/constants/routes";
import { refreshInstance } from "./axiosInstance";

// Custom event for auth failures
export const AUTH_ERROR_EVENT = "auth:error";
export const emitAuthError = (error: ApiError) => {
  window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT, { detail: error }));
};

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _isRefreshRequest?: boolean;
  _refreshAttempts?: number;
}

interface ExtendedInternalAxiosRequestConfig
  extends InternalAxiosRequestConfig {
  _isRefreshRequest?: boolean;
  _refreshAttempts?: number;
}

interface RefreshResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  };
}

// Single refresh attempt promise and request queue
let refreshAttempt: Promise<string> | null = null;
const MAX_RETRY_ATTEMPTS = 3;

interface QueuedRequest {
  config: ExtendedInternalAxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

let requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;

async function processQueue(newToken: string, axiosInstance: AxiosInstance) {
  if (isProcessingQueue) return;

  try {
    isProcessingQueue = true;
    while (requestQueue.length > 0) {
      const { config, resolve, reject } = requestQueue.shift()!;
      try {
        config.headers.Authorization = `Bearer ${newToken}`;
        resolve(await axiosInstance(config));
      } catch (error) {
        reject(error);
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

function getCurrentSessionId(): string | null {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_session="))
      ?.split("=")[1] || null
  );
}

interface TokenState {
  accessToken: string | null;
  expiresAt: number | null;
}

let currentTokenState: TokenState = {
  accessToken: null,
  expiresAt: null,
};

function isTokenExpired(): boolean {
  return (
    !currentTokenState.expiresAt || Date.now() >= currentTokenState.expiresAt
  );
}

// Add a semaphore to track refresh state
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function handleTokenRefresh(
  axiosInstance: AxiosInstance
): Promise<string> {
  // Return existing refresh promise if one is in progress
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  if (!isTokenExpired() && currentTokenState.accessToken) {
    return currentTokenState.accessToken;
  }

  const sessionId = getCurrentSessionId();
  if (!sessionId) {
    throw new ApiError("No session available", ApiErrorType.UNAUTHORIZED, 401, {
      code: "NO_SESSION",
    });
  }

  try {
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const response = await refreshInstance.post<RefreshResponse>(
          "/auth/refresh-token",
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        currentTokenState = {
          accessToken,
          expiresAt: Date.now() + 15 * 1000 - 500,
        };

        // Update token in both axios instances
        [axiosInstance, refreshInstance].forEach((instance) => {
          instance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;
        });

        const newSessionId = getCurrentSessionId();
        if (!newSessionId || newSessionId === sessionId) {
          throw new ApiError(
            "Session not updated",
            ApiErrorType.UNAUTHORIZED,
            401,
            { code: "SESSION_NOT_UPDATED" }
          );
        }

        return accessToken;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    const newToken = await refreshPromise;
    await processQueue(newToken, axiosInstance);
    return newToken;
  } catch (error) {
    currentTokenState = { accessToken: null, expiresAt: null };
    refreshPromise = null;
    isRefreshing = false;
    throw error;
  }
}

export function setupInterceptors(axiosInstance: AxiosInstance) {
  if ((axiosInstance as any).__interceptorsInitialized) {
    return;
  }
  (axiosInstance as any).__interceptorsInitialized = true;

  axiosInstance.interceptors.request.use(
    (config: ExtendedInternalAxiosRequestConfig) => {
      if ((config as ExtendedAxiosRequestConfig)._isRefreshRequest) {
        config._isRefreshRequest = true;
      }
      config.withCredentials = true;
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest =
        error.config as ExtendedInternalAxiosRequestConfig;

      if (
        !originalRequest ||
        originalRequest.url.startsWith("/auth/") ||
        (originalRequest.url && isPublicRoute(originalRequest.url)) ||
        (originalRequest._refreshAttempts || 0) >= MAX_RETRY_ATTEMPTS ||
        !error.response ||
        error.response.status !== 401 ||
        !hasAuthSession() ||
        originalRequest._isRefreshRequest
      ) {
        if (
          error.response?.status === 401 &&
          originalRequest?.url &&
          !isPublicRoute(originalRequest.url) &&
          !originalRequest.url.startsWith("/auth/") &&
          !originalRequest._isRefreshRequest
        ) {
          emitAuthError(
            new ApiError(
              "Authentication failed",
              ApiErrorType.UNAUTHORIZED,
              401,
              {
                code: "AUTH_FAILED",
              }
            )
          );
        }
        throw error;
      }

      try {
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

        const newToken = await handleTokenRefresh(axiosInstance);
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }

        throw error;
      } catch (refreshError) {
        const authError =
          refreshError instanceof ApiError
            ? refreshError
            : new ApiError(
                "Authentication refresh failed",
                ApiErrorType.UNAUTHORIZED,
                401,
                { code: "AUTH_REFRESH_FAILED" }
              );

        emitAuthError(authError);
        throw authError;
      }
    }
  );
}
