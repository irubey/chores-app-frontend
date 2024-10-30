import {
  shouldSkipTokenRefresh,
  RetryableAxiosRequestConfig,
} from "../interceptors";
import { ApiError, AuthenticationError } from "../errors";
import { axiosInstance } from "../axiosInstance";

class TokenService {
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(error?: Error) => void> = [];
  private onAuthError?: () => void;

  /**
   * Subscribes to token refresh events.
   * @param callback - Function to call when token refresh is done or fails.
   */
  public subscribeTokenRefresh(callback: (error?: Error) => void): void {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notifies all subscribers about the token refresh result.
   * @param error - Optional error if token refresh failed.
   */
  private notifyRefreshSubscribers(error?: Error): void {
    this.refreshSubscribers.forEach((callback) => callback(error));
    this.refreshSubscribers = [];
  }

  /**
   * Sets a handler for authentication errors.
   * @param callback - Function to call on auth errors.
   */
  public setAuthErrorHandler(callback: () => void): void {
    this.onAuthError = callback;
  }

  /**
   * Refreshes the authentication token.
   */
  public async refreshToken(): Promise<void> {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
    try {
      const response = await axiosInstance.post("/auth/refresh-token");
      if (!response.data) {
        throw new Error("No data received from refresh token request");
      }
      this.notifyRefreshSubscribers();
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.notifyRefreshSubscribers(
        error instanceof Error ? error : new Error("Token refresh failed")
      );
      throw new AuthenticationError("Session expired. Please login again.");
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handles 401 Unauthorized errors by refreshing the token and retrying the original request.
   * @param originalRequest - The original Axios request configuration.
   * @returns The Axios response promise.
   */
  public async handle401Error(
    originalRequest: RetryableAxiosRequestConfig
  ): Promise<any> {
    if (originalRequest._retry || shouldSkipTokenRefresh(originalRequest)) {
      this.cleanup();
      throw new ApiError("Unauthorized", 401);
    }

    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.subscribeTokenRefresh((error) => {
          if (error) {
            reject(error);
          } else {
            resolve(axiosInstance(originalRequest));
          }
        });
      });
    }

    originalRequest._retry = true;
    try {
      await this.refreshToken();
      return axiosInstance(originalRequest);
    } catch (error) {
      this.cleanup();
      if (originalRequest.url?.includes("/users/profile")) {
        throw new ApiError("Unauthorized", 401);
      }
      throw error;
    }
  }

  /**
   * Cleanup method to reset the token service state.
   */
  public cleanup(): void {
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }
}

export const tokenService = new TokenService();
