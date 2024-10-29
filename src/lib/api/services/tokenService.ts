import { axiosInstance } from "../axiosInstance";
import { AuthenticationError } from "../errors";

class TokenService {
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<() => void> = [];
  private onAuthError?: () => void; // Callback for authentication errors

  /**
   * Subscribe to token refresh event.
   * @param callback - Function to execute once token is refreshed.
   */
  public subscribeTokenRefresh(callback: () => void): void {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify all subscribers that the token has been refreshed.
   */
  private notifyRefreshSubscribers(): void {
    this.refreshSubscribers.forEach((callback) => callback());
    this.refreshSubscribers = [];
  }

  /**
   * Set the authentication error handler callback.
   * @param callback - Function to execute on authentication error.
   */
  public setAuthErrorHandler(callback: () => void): void {
    this.onAuthError = callback;
  }

  /**
   * Refresh the authentication token.
   */
  public async refreshToken(): Promise<void> {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
    try {
      await axiosInstance.post("/auth/refresh-token");
      this.notifyRefreshSubscribers();
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.notifyRefreshSubscribers();

      if (this.onAuthError) {
        this.onAuthError(); // Invoke the callback on authentication error
      }

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
  public async handle401Error(originalRequest: any): Promise<any> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.subscribeTokenRefresh(() => {
          // Retry the original request after token refresh
          axiosInstance(originalRequest).then(resolve).catch(reject);
        });
      });
    }

    originalRequest._retry = true;
    try {
      await this.refreshToken();
      return axiosInstance(originalRequest);
    } catch (error) {
      return Promise.reject(error);
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
