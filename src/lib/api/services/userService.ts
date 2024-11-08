import { ApiResponse } from "@shared/interfaces";
import { User, UpdateUserDTO } from "@shared/types";
import { BaseApiClient } from "../baseClient";

export class UserService extends BaseApiClient {
  /**
   * Get the current user's profile
   */
  public async getProfile(signal?: AbortSignal): Promise<User> {
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
  ): Promise<User> {
    return this.handleRequest(() =>
      this.axiosInstance.patch<ApiResponse<User>>("/users/profile", userData, {
        signal,
      })
    );
  }
}
