// src/lib/api/services/householdService.ts
import {
  handleApiRequest,
  buildRequestConfig,
  ApiRequestOptions,
} from "../utils/apiUtils";
import { axiosInstance } from "../axiosInstance";
import { ApiResponse } from "@shared/interfaces";
import {
  Household,
  HouseholdWithMembers,
  HouseholdMember,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";

export const householdKeys = {
  all: ["households"] as const,
  lists: () => [...householdKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...householdKeys.lists(), params] as const,
  details: () => [...householdKeys.all, "detail"] as const,
  detail: (householdId: string) =>
    [...householdKeys.details(), householdId] as const,
  members: (householdId: string) =>
    [...householdKeys.detail(householdId), "members"] as const,
  userHouseholds: () => [...householdKeys.all, "user"] as const,
  invitations: () => [...householdKeys.all, "invitations"] as const,
} as const;

export const householdApi = {
  households: {
    getUserHouseholds: async (
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdWithMembers[]>> => {
      return handleApiRequest<HouseholdWithMembers[]>(
        () =>
          axiosInstance.get(
            "/households/user/households",
            buildRequestConfig(config)
          ),
        {
          operation: "Get User Households",
        }
      );
    },

    getHouseholdById: async (
      householdId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdWithMembers>> => {
      return handleApiRequest<HouseholdWithMembers>(
        () =>
          axiosInstance.get(
            `/households/${householdId}`,
            buildRequestConfig(config)
          ),
        {
          operation: "Get Household By ID",
          metadata: { householdId },
        }
      );
    },

    createHousehold: async (
      data: CreateHouseholdDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdWithMembers>> => {
      return handleApiRequest<HouseholdWithMembers>(
        () =>
          axiosInstance.post("/households", data, buildRequestConfig(config)),
        {
          operation: "Create Household",
          metadata: { name: data.name },
        }
      );
    },

    updateHousehold: async (
      householdId: string,
      data: UpdateHouseholdDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdWithMembers>> => {
      return handleApiRequest<HouseholdWithMembers>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Update Household",
          metadata: { householdId, updatedFields: Object.keys(data) },
        }
      );
    },

    deleteHousehold: async (
      householdId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<void>> => {
      return handleApiRequest<void>(
        () =>
          axiosInstance.delete(
            `/households/${householdId}`,
            buildRequestConfig(config)
          ),
        {
          operation: "Delete Household",
          metadata: { householdId },
        }
      );
    },

    getMembers: async (
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
          operation: "Get Household Members",
          metadata: { householdId },
        }
      );
    },

    updateMember: async (
      householdId: string,
      memberId: string,
      data: {
        role?: HouseholdRole;
        leftAt?: Date;
        nickname?: string;
        isSelected?: boolean;
      },
      config?: ApiRequestOptions
    ): Promise<ApiResponse<void>> => {
      return handleApiRequest<void>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}/members/${memberId}`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Update Household Member",
          metadata: { householdId, memberId, updatedFields: Object.keys(data) },
        }
      );
    },

    sendInvitation: async (
      householdId: string,
      email: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<void>> => {
      return handleApiRequest<void>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/invitations/send`,
            { email },
            buildRequestConfig(config)
          ),
        {
          operation: "Send Household Invitation",
          metadata: { householdId, email },
        }
      );
    },
  },
} as const;

export type HouseholdApi = typeof householdApi;
