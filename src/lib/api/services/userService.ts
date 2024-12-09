import {
  handleApiRequest,
  buildRequestConfig,
  ApiRequestOptions,
} from "../utils/apiUtils";
import { axiosInstance } from "../axiosInstance";
import { ApiResponse } from "@shared/interfaces";
import { User, UpdateUserDTO } from "@shared/types";

export const userKeys = {
  all: ["users"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
} as const;

export const userApi = {
  users: {
    getProfile: async (
      config?: ApiRequestOptions
    ): Promise<ApiResponse<User>> => {
      return handleApiRequest<User>(
        () =>
          axiosInstance.get("/users/profile", {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
        {
          operation: "Get User Profile",
        }
      );
    },

    updateProfile: async (
      data: UpdateUserDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<User>> => {
      return handleApiRequest<User>(
        () =>
          axiosInstance.patch("/users/profile", data, {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
        {
          operation: "Update User Profile",
          metadata: {
            updatedFields: Object.keys(data),
          },
        }
      );
    },
  },
} as const;

export type UserApi = typeof userApi;
