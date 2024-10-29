import { ApiResponse } from "@shared/interfaces";
import { User } from "@shared/types";
import { BaseApiClient } from "../baseClient";
import { ApiError } from "../errors";

export class AuthService extends BaseApiClient {
  /**
   * Register a new user
   */
  public async register(
    data: {
      email: string;
      password: string;
      name: string;
    },
    signal?: AbortSignal
  ): Promise<User> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<User>>(
        "/auth/register",
        data,
        { signal }
      );
      return this.extractData(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  public async login(
    credentials: {
      email: string;
      password: string;
    },
    signal?: AbortSignal
  ): Promise<User> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<User>>(
        "/auth/login",
        credentials,
        { signal }
      );
      return this.extractData(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout the current user
   */
  public async logout(signal?: AbortSignal): Promise<void> {
    try {
      await this.axiosInstance.post("/auth/logout", {}, { signal });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize authentication state
   */
  public async initializeAuth(signal?: AbortSignal): Promise<User | null> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<User>>(
        "/users/profile",
        { signal }
      );
      return this.extractData(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  }
}
