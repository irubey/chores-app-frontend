import {
  handleApiRequest,
  buildRequestConfig,
  ApiRequestOptions,
} from "../utils/apiUtils";
import { axiosInstance } from "../axiosInstance";
import { ApiResponse } from "@shared/interfaces";
import { User, RegisterUserDTO, LoginCredentials } from "@shared/types";

export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
} as const;

export const authApi = {
  auth: {
    register: async (
      data: RegisterUserDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<User>> => {
      return handleApiRequest<User>(
        () =>
          axiosInstance.post("/auth/register", data, {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
        {
          operation: "Register User",
          metadata: { email: data.email },
        }
      );
    },

    login: async (
      credentials: LoginCredentials,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<User>> => {
      return handleApiRequest<User>(
        () =>
          axiosInstance.post("/auth/login", credentials, {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
        {
          operation: "Login User",
          metadata: { email: credentials.email },
        }
      );
    },

    logout: async (config?: ApiRequestOptions): Promise<void> => {
      await handleApiRequest<void>(
        () =>
          axiosInstance.post(
            "/auth/logout",
            {},
            {
              ...buildRequestConfig(config),
              withCredentials: true,
            }
          ),
        {
          operation: "Logout User",
        }
      );
    },

    initializeAuth: async (
      config?: ApiRequestOptions
    ): Promise<ApiResponse<User> | null> => {
      try {
        return await handleApiRequest<User>(
          () =>
            axiosInstance.get("/users/profile", {
              ...buildRequestConfig(config),
              withCredentials: true,
            }),
          {
            operation: "Initialize Auth",
          }
        );
      } catch (error) {
        if (error.status === 401) {
          return null;
        }
        throw error;
      }
    },
  },
} as const;

export type AuthApi = typeof authApi;
