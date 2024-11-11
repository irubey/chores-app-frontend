import { ApiResponse } from "@shared/interfaces";
import { User, UpdateUserDTO } from "@shared/types";
import { BaseApiClient } from "../baseClient";
import { logger } from "../logger";

export class UserService extends BaseApiClient {
  /**
   * Get the current user's profile
   */
  public async getProfile(signal?: AbortSignal): Promise<ApiResponse<User>> {
    logger.debug("Getting user profile");
    return this.handleRequest(() =>
      this.axiosInstance.get<ApiResponse<User>>("/users/profile", { signal })
    );
  }

  /**
   * Update the current user's profile
   */
  public async updateProfile(
    userData: UpdateUserDTO,
    signal?: AbortSignal
  ): Promise<ApiResponse<User>> {
    logger.debug("Updating user profile", { userData });
    return this.handleRequest(() =>
      this.axiosInstance.patch<ApiResponse<User>>("/users/profile", userData, {
        signal,
      })
    );
  }
}
