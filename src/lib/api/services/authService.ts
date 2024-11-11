import { ApiResponse } from "@shared/interfaces";
import { User } from "@shared/types";
import { BaseApiClient } from "../baseClient";
import { ApiError } from "../errors/apiErrors";
import { RegisterUserDTO, LoginCredentials } from "@shared/types/user";
import { logger } from "../logger";

export class AuthService extends BaseApiClient {
  /**
   * Register a new user
   */
  public async register(
    data: RegisterUserDTO,
    signal?: AbortSignal
  ): Promise<ApiResponse<User>> {
    logger.debug("Registering new user", { email: data.email });
    return this.handleRequest(() =>
      this.axiosInstance.post<ApiResponse<User>>("/auth/register", data, {
        signal,
      })
    );
  }

  /**
   * Login with email and password
   */
  public async login(
    credentials: LoginCredentials,
    signal?: AbortSignal
  ): Promise<ApiResponse<User>> {
    logger.debug("Logging in user", { email: credentials.email });
    return this.handleRequest(() =>
      this.axiosInstance.post<ApiResponse<User>>("/auth/login", credentials, {
        signal,
      })
    );
  }

  /**
   * Logout the current user
   */
  public async logout(signal?: AbortSignal): Promise<ApiResponse<void>> {
    logger.debug("Logging out user");
    return this.handleRequest(() =>
      this.axiosInstance.post<ApiResponse<void>>("/auth/logout", {}, { signal })
    );
  }

  /**
   * Initialize authentication state
   */
  public async initializeAuth(
    signal?: AbortSignal
  ): Promise<ApiResponse<User> | null> {
    logger.debug("Initializing auth state");
    try {
      return await this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<User>>("/users/profile", { signal })
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logger.info("User not authenticated");
        return null;
      }
      throw error;
    }
  }
}
