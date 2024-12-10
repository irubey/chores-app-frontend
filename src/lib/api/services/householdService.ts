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
    ): Promise<ApiResponse<HouseholdWithMembers>> => {
      return handleApiRequest<HouseholdWithMembers>(
        () =>
          axiosInstance.get(`/households/${id}`, buildRequestConfig(config)),
        {
          operation: "Get Household",
          metadata: { householdId: id },
        }
      );
    },

    create: async (
      data: CreateHouseholdDTO
    ): Promise<ApiResponse<HouseholdWithMembers>> => {
      return handleApiRequest<HouseholdWithMembers>(
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
    },

    update: async (
      id: string,
      data: UpdateHouseholdDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdWithMembers>> => {
      return handleApiRequest<HouseholdWithMembers>(
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
    },

    delete: async (
      id: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<void>> => {
      return handleApiRequest<void>(
        () =>
          axiosInstance.delete(`/households/${id}`, buildRequestConfig(config)),
        {
          operation: "Delete Household",
          metadata: { householdId: id },
        }
      );
    },

    updateHouseholdSelection: async (
      householdId: string,
      memberId: string,
      isSelected: boolean,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdMemberWithUser>> => {
      return handleApiRequest<HouseholdMemberWithUser>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}/members/${memberId}/selection`,
            { isSelected },
            buildRequestConfig(config)
          ),
        {
          operation: "Update Household Selection",
          metadata: {
            householdId,
            memberId,
            isSelected,
          },
        }
      );
    },
  },

  members: {
    list: async (
      householdId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdMemberWithUser[]>> => {
      return handleApiRequest<HouseholdMemberWithUser[]>(
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
    ): Promise<ApiResponse<HouseholdMemberWithUser>> => {
      // If leftAt is provided, use DELETE endpoint to remove the member
      if ("leftAt" in data) {
        return handleApiRequest<HouseholdMemberWithUser>(
          () =>
            axiosInstance.delete(
              `/households/${householdId}/members/${memberId}`,
              buildRequestConfig(config)
            ),
          {
            operation: "Remove Household Member",
            metadata: {
              householdId,
              memberId,
            },
          }
        );
      }

      // For role updates
      if ("role" in data) {
        return handleApiRequest<HouseholdMemberWithUser>(
          () =>
            axiosInstance.patch(
              `/households/${householdId}/members/${memberId}/role`,
              { role: data.role },
              buildRequestConfig(config)
            ),
          {
            operation: "Update Member Role",
            metadata: {
              householdId,
              memberId,
              role: data.role,
            },
          }
        );
      }

      // For status updates (accepting/rejecting invitations)
      if ("isAccepted" in data || "isRejected" in data) {
        return handleApiRequest<HouseholdMemberWithUser>(
          () =>
            axiosInstance.patch(
              `/households/${householdId}/members/${memberId}/status`,
              data,
              buildRequestConfig(config)
            ),
          {
            operation: "Update Member Status",
            metadata: {
              householdId,
              memberId,
              updatedFields: Object.keys(data),
            },
          }
        );
      }

      throw new Error("Invalid member update operation");
    },
  },

  invitations: {
    send: async (
      householdId: string,
      email: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdMemberWithUser>> => {
      return handleApiRequest<HouseholdMemberWithUser>(
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
    },
  },
} as const;

export type HouseholdApi = typeof householdApi;
