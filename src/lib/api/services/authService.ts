import { ApiResponse } from "@shared/interfaces";
import { User } from "@shared/types";
import { BaseApiClient } from "../baseClient";
import { ApiError } from "../errors";
import { RegisterUserDTO, LoginCredentials } from "@shared/types/user";
import { logger } from "../logger";

/**
 * AuthService handles high-level authentication operations.
 * All token management is handled by HTTP-only cookies on the backend.
 */
export class AuthService extends BaseApiClient {
  /**
   * Register a new user
   */
  public async register(
    data: RegisterUserDTO,
    signal?: AbortSignal
  ): Promise<ApiResponse<User>> {
    logger.debug("Registering new user", { email: data.email });
    try {
      return await this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<User>>("/auth/register", data, {
          signal,
          withCredentials: true,
        })
      );
    } catch (error) {
      logger.error("Registration failed", { error, email: data.email });
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  public async login(
    credentials: LoginCredentials,
    signal?: AbortSignal
  ): Promise<ApiResponse<User>> {
    logger.debug("Logging in user", { email: credentials.email });
    try {
      const response = await this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<User>>("/auth/login", credentials, {
          signal,
          withCredentials: true,
        })
      );
      logger.info("Login successful", { email: credentials.email });
      return response;
    } catch (error) {
      logger.error("Login failed", { error, email: credentials.email });
      throw error;
    }
  }

  /**
   * Logout the current user
   */
  public async logout(signal?: AbortSignal): Promise<void> {
    logger.debug("Logging out user");
    try {
      await this.axiosInstance.post(
        "/auth/logout",
        {},
        {
          signal,
          withCredentials: true,
        }
      );
      logger.info("Logout successful");
    } catch (error) {
      logger.error("Logout failed", { error });
      throw error;
    }
  }

  /**
   * Initialize authentication state by checking if user is already logged in
   * via valid cookies
   */
  public async initializeAuth(
    signal?: AbortSignal
  ): Promise<ApiResponse<User> | null> {
    logger.debug("Initializing auth state");
    try {
      const response = await this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<User>>("/users/profile", {
          signal,
          withCredentials: true,
        })
      );
      logger.info("Auth initialization successful", {
        userId: response.data.id,
      });
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logger.info("User not authenticated");
        return null;
      }
      logger.error("Unexpected error during auth initialization", { error });
      throw error;
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();
