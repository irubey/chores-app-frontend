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
  list: (config?: ApiRequestOptions) =>
    [...householdKeys.lists(), config] as const,
  userHouseholds: () => [...householdKeys.all, "user"] as const,
  invitations: () => [...householdKeys.all, "invitations"] as const,
  details: () => [...householdKeys.all, "detail"] as const,
  detail: (id: string) => [...householdKeys.details(), id] as const,
  members: (id: string) => [...householdKeys.detail(id), "members"] as const,
} as const;

export const householdApi = {
  households: {
    getUserHouseholds: async (
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdWithMembers[]>> => {
      return handleApiRequest<HouseholdWithMembers[]>(
        () =>
          axiosInstance.get("/households/user/households", {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
        {
          operation: "Get User Households",
        }
      );
    },

    getPendingInvitations: async (
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdWithMembers[]>> => {
      return handleApiRequest<HouseholdWithMembers[]>(
        () =>
          axiosInstance.get("/households/user/invitations", {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
        {
          operation: "Get Pending Invitations",
        }
      );
    },

    getHouseholdById: async (
      householdId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdWithMembers>> => {
      return handleApiRequest<HouseholdWithMembers>(
        () =>
          axiosInstance.get(`/households/${householdId}`, {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
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
          axiosInstance.post("/households", data, {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
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
          axiosInstance.patch(`/households/${householdId}`, data, {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
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
          axiosInstance.delete(`/households/${householdId}`, {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
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
          axiosInstance.get(`/households/${householdId}/members`, {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
        {
          operation: "Get Household Members",
          metadata: { householdId },
        }
      );
    },

    addMember: async (
      householdId: string,
      data: AddMemberDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdMember>> => {
      return handleApiRequest<HouseholdMember>(
        () =>
          axiosInstance.post(`/households/${householdId}/members`, data, {
            ...buildRequestConfig(config),
            withCredentials: true,
          }),
        {
          operation: "Add Household Member",
          metadata: { householdId, email: data.email },
        }
      );
    },

    removeMember: async (
      householdId: string,
      memberId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<void>> => {
      return handleApiRequest<void>(
        () =>
          axiosInstance.delete(
            `/households/${householdId}/members/${memberId}`,
            {
              ...buildRequestConfig(config),
              withCredentials: true,
            }
          ),
        {
          operation: "Remove Household Member",
          metadata: { householdId, memberId },
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
            {
              ...buildRequestConfig(config),
              withCredentials: true,
            }
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
            {
              ...buildRequestConfig(config),
              withCredentials: true,
            }
          ),
        {
          operation: "Send Household Invitation",
          metadata: { householdId, email },
        }
      );
    },

    acceptInvitation: async (
      householdId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdMember>> => {
      return handleApiRequest<HouseholdMember>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/invitations/accept`,
            {},
            {
              ...buildRequestConfig(config),
              withCredentials: true,
            }
          ),
        {
          operation: "Accept Household Invitation",
          metadata: { householdId },
        }
      );
    },

    rejectInvitation: async (
      householdId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<void>> => {
      return handleApiRequest<void>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/invitations/reject`,
            {},
            {
              ...buildRequestConfig(config),
              withCredentials: true,
            }
          ),
        {
          operation: "Reject Household Invitation",
          metadata: { householdId },
        }
      );
    },
  },
} as const;

export type HouseholdApi = typeof householdApi;
