import {
  handleApiRequest,
  ApiRequestOptions,
  buildRequestConfig,
} from "../utils/apiUtils";
import { axiosInstance } from "../axiosInstance";
import { ApiResponse } from "@shared/interfaces";
import {
  Chore,
  ChoreWithAssignees,
  Subtask,
  CreateChoreDTO,
  UpdateChoreDTO,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  ChoreSwapRequest,
} from "@shared/types";

export const choreKeys = {
  all: ["chores"] as const,
  lists: () => [...choreKeys.all, "list"] as const,
  list: (householdId: string, params?: Record<string, unknown>) =>
    [...choreKeys.lists(), householdId, params] as const,
  details: () => [...choreKeys.all, "detail"] as const,
  detail: (householdId: string, choreId: string) =>
    [...choreKeys.details(), householdId, choreId] as const,
  subtasks: {
    all: (householdId: string, choreId: string) =>
      [...choreKeys.detail(householdId, choreId), "subtasks"] as const,
    detail: (householdId: string, choreId: string, subtaskId: string) =>
      [
        ...choreKeys.detail(householdId, choreId),
        "subtasks",
        subtaskId,
      ] as const,
  },
  swapRequests: (householdId: string, choreId: string) =>
    [...choreKeys.detail(householdId, choreId), "swap-requests"] as const,
} as const;

export const choreApi = {
  chores: {
    list: async (
      householdId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<ChoreWithAssignees[]>> => {
      return handleApiRequest<ChoreWithAssignees[]>(
        () =>
          axiosInstance.get(
            `/households/${householdId}/chores`,
            buildRequestConfig(config)
          ),
        {
          operation: "List Chores",
          metadata: { householdId },
        }
      );
    },

    get: async (
      householdId: string,
      choreId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<ChoreWithAssignees>> => {
      return handleApiRequest<ChoreWithAssignees>(
        () =>
          axiosInstance.get(
            `/households/${householdId}/chores/${choreId}`,
            buildRequestConfig(config)
          ),
        {
          operation: "Get Chore",
          metadata: { householdId, choreId },
        }
      );
    },

    create: async (
      householdId: string,
      data: CreateChoreDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<ChoreWithAssignees>> => {
      return handleApiRequest<ChoreWithAssignees>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/chores`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Create Chore",
          metadata: { householdId, title: data.title },
        }
      );
    },

    update: async (
      householdId: string,
      choreId: string,
      data: UpdateChoreDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<ChoreWithAssignees>> => {
      return handleApiRequest<ChoreWithAssignees>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}/chores/${choreId}`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Update Chore",
          metadata: {
            householdId,
            choreId,
            updatedFields: Object.keys(data),
          },
        }
      );
    },

    delete: async (
      householdId: string,
      choreId: string,
      config?: ApiRequestOptions
    ): Promise<void> => {
      await handleApiRequest<void>(
        () =>
          axiosInstance.delete(
            `/households/${householdId}/chores/${choreId}`,
            buildRequestConfig(config)
          ),
        {
          operation: "Delete Chore",
          metadata: { householdId, choreId },
        }
      );
    },
  },

  subtasks: {
    list: async (
      householdId: string,
      choreId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<Subtask[]>> => {
      return handleApiRequest<Subtask[]>(
        () =>
          axiosInstance.get(
            `/households/${householdId}/chores/${choreId}/subtasks`,
            buildRequestConfig(config)
          ),
        {
          operation: "List Subtasks",
          metadata: { householdId, choreId },
        }
      );
    },

    create: async (
      householdId: string,
      choreId: string,
      data: CreateSubtaskDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<Subtask>> => {
      return handleApiRequest<Subtask>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/chores/${choreId}/subtasks`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Create Subtask",
          metadata: { householdId, choreId, title: data.title },
        }
      );
    },

    update: async (
      householdId: string,
      choreId: string,
      subtaskId: string,
      data: UpdateSubtaskDTO,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<Subtask>> => {
      return handleApiRequest<Subtask>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Update Subtask",
          metadata: {
            householdId,
            choreId,
            subtaskId,
            updatedFields: Object.keys(data),
          },
        }
      );
    },

    delete: async (
      householdId: string,
      choreId: string,
      subtaskId: string,
      config?: ApiRequestOptions
    ): Promise<void> => {
      await handleApiRequest<void>(
        () =>
          axiosInstance.delete(
            `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`,
            buildRequestConfig(config)
          ),
        {
          operation: "Delete Subtask",
          metadata: { householdId, choreId, subtaskId },
        }
      );
    },
  },

  swapRequests: {
    create: async (
      householdId: string,
      choreId: string,
      targetUserId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<ChoreSwapRequest>> => {
      return handleApiRequest<ChoreSwapRequest>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/chores/${choreId}/swap-request`,
            { targetUserId },
            buildRequestConfig(config)
          ),
        {
          operation: "Create Swap Request",
          metadata: { householdId, choreId, targetUserId },
        }
      );
    },

    approveOrReject: async (
      householdId: string,
      choreId: string,
      swapRequestId: string,
      approved: boolean,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<ChoreWithAssignees>> => {
      return handleApiRequest<ChoreWithAssignees>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}/chores/${choreId}/swap-approve`,
            { approved },
            buildRequestConfig(config)
          ),
        {
          operation: "Approve/Reject Swap Request",
          metadata: { householdId, choreId, swapRequestId, approved },
        }
      );
    },
  },
} as const;

export type ChoreApi = typeof choreApi;
