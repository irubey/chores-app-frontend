// src/lib/api/services/householdService.ts
import {
  handleApiRequest,
  createQueryKeys,
  ApiRequestOptions,
  buildRequestConfig,
} from "../utils/apiUtils";
import { axiosInstance } from "../axiosInstance";
import type {
  HouseholdWithMembers,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  HouseholdMember,
  HouseholdMemberWithUser,
} from "@shared/types";
import type { PaginationOptions } from "@shared/interfaces";
import { ApiResponse } from "@shared/interfaces/apiResponse";

export const householdKeys = {
  all: ["households"] as const,
  lists: () => [...householdKeys.all, "list"] as const,
  list: (params?: PaginationOptions) =>
    [...householdKeys.lists(), params] as const,
  details: () => [...householdKeys.all, "detail"] as const,
  detail: (id: string) => [...householdKeys.details(), id] as const,
  members: (householdId: string) =>
    [...householdKeys.detail(householdId), "members"] as const,
  membersList: (householdId: string, params?: PaginationOptions) =>
    [...householdKeys.members(householdId), params] as const,
};

export const householdApi = {
  households: {
    list: async (
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdWithMembers[]>> => {
      return handleApiRequest<HouseholdWithMembers[]>(
        () => axiosInstance.get("/households", buildRequestConfig(config)),
        {
          operation: "List Households",
          metadata: { params: config?.params },
        }
      );
    },

    get: async (
      id: string,
      config?: ApiRequestOptions
    ): Promise<HouseholdWithMembers> => {
      const result = await handleApiRequest<HouseholdWithMembers>(
        () =>
          axiosInstance.get(`/households/${id}`, buildRequestConfig(config)),
        {
          operation: "Get Household",
          metadata: { householdId: id },
        }
      );
      return result.data;
    },

    create: async (data: CreateHouseholdDTO): Promise<HouseholdWithMembers> => {
      const result = await handleApiRequest<HouseholdWithMembers>(
        () => axiosInstance.post("/households", data),
        {
          operation: "Create Household",
          metadata: {
            name: data.name,
            currency: data.currency,
            timezone: data.timezone,
            language: data.language,
          },
        }
      );
      return result.data;
    },

    update: async (
      id: string,
      data: UpdateHouseholdDTO,
      config?: ApiRequestOptions
    ): Promise<HouseholdWithMembers> => {
      const result = await handleApiRequest<HouseholdWithMembers>(
        () =>
          axiosInstance.patch(
            `/households/${id}`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Update Household",
          metadata: {
            householdId: id,
            updatedFields: Object.keys(data),
          },
        }
      );
      return result.data;
    },

    delete: async (id: string, config?: ApiRequestOptions): Promise<void> => {
      await handleApiRequest<void>(
        () =>
          axiosInstance.delete(`/households/${id}`, buildRequestConfig(config)),
        {
          operation: "Delete Household",
          metadata: { householdId: id },
        }
      );
    },
  },

  members: {
    list: async (
      householdId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdMember[]>> => {
      return handleApiRequest<HouseholdMember[]>(
        () =>
          axiosInstance.get(
            `/households/${householdId}/members`,
            buildRequestConfig(config)
          ),
        {
          operation: "List Household Members",
          metadata: {
            householdId,
            params: config?.params,
          },
        }
      );
    },

    update: async (
      householdId: string,
      memberId: string,
      data: Partial<HouseholdMember>,
      config?: ApiRequestOptions
    ): Promise<HouseholdMember> => {
      const result = await handleApiRequest<HouseholdMember>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}/members/${memberId}`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Update Household Member",
          metadata: {
            householdId,
            memberId,
            updatedFields: Object.keys(data),
          },
        }
      );
      return result.data;
    },
  },

  invitations: {
    send: async (
      householdId: string,
      email: string,
      config?: ApiRequestOptions
    ): Promise<HouseholdMemberWithUser> => {
      const result = await handleApiRequest<HouseholdMemberWithUser>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/invitations`,
            { email },
            buildRequestConfig(config)
          ),
        {
          operation: "Send Household Invitation",
          metadata: {
            householdId,
            // Mask email in logs for privacy
            emailDomain: email.split("@")[1],
          },
        }
      );
      return result.data;
    },
  },
} as const;

export type HouseholdApi = typeof householdApi;
