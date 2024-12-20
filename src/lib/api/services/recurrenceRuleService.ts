import {
  handleApiRequest,
  ApiRequestOptions,
  buildRequestConfig,
} from "../utils/apiUtils";
import { axiosInstance } from "../axiosInstance";
import { ApiResponse } from "@shared/interfaces";
import {
  RecurrenceRule,
  CreateRecurrenceRuleDTO,
  UpdateRecurrenceRuleDTO,
} from "@shared/types";

export const recurrenceRuleKeys = {
  all: ["recurrenceRules"] as const,
  lists: () => [...recurrenceRuleKeys.all, "list"] as const,
  list: () => [...recurrenceRuleKeys.lists()] as const,
  details: () => [...recurrenceRuleKeys.all, "detail"] as const,
  detail: (ruleId: string) =>
    [...recurrenceRuleKeys.details(), ruleId] as const,
} as const;

export const recurrenceRuleApi = {
  list: async (
    config?: ApiRequestOptions
  ): Promise<ApiResponse<RecurrenceRule[]>> => {
    return handleApiRequest<RecurrenceRule[]>(
      () => axiosInstance.get("/recurrence-rules", buildRequestConfig(config)),
      {
        operation: "List Recurrence Rules",
      }
    );
  },

  get: async (
    ruleId: string,
    config?: ApiRequestOptions
  ): Promise<ApiResponse<RecurrenceRule>> => {
    return handleApiRequest<RecurrenceRule>(
      () =>
        axiosInstance.get(
          `/recurrence-rules/${ruleId}`,
          buildRequestConfig(config)
        ),
      {
        operation: "Get Recurrence Rule",
        metadata: { ruleId },
      }
    );
  },

  create: async (
    data: CreateRecurrenceRuleDTO,
    config?: ApiRequestOptions
  ): Promise<ApiResponse<RecurrenceRule>> => {
    return handleApiRequest<RecurrenceRule>(
      () =>
        axiosInstance.post(
          "/recurrence-rules",
          data,
          buildRequestConfig(config)
        ),
      {
        operation: "Create Recurrence Rule",
        metadata: { frequency: data.frequency, interval: data.interval },
      }
    );
  },

  update: async (
    ruleId: string,
    data: UpdateRecurrenceRuleDTO,
    config?: ApiRequestOptions
  ): Promise<ApiResponse<RecurrenceRule>> => {
    return handleApiRequest<RecurrenceRule>(
      () =>
        axiosInstance.patch(
          `/recurrence-rules/${ruleId}`,
          data,
          buildRequestConfig(config)
        ),
      {
        operation: "Update Recurrence Rule",
        metadata: { ruleId, updatedFields: Object.keys(data) },
      }
    );
  },

  delete: async (
    ruleId: string,
    config?: ApiRequestOptions
  ): Promise<ApiResponse<void>> => {
    return handleApiRequest<void>(
      () =>
        axiosInstance.delete(
          `/recurrence-rules/${ruleId}`,
          buildRequestConfig(config)
        ),
      {
        operation: "Delete Recurrence Rule",
        metadata: { ruleId },
      }
    );
  },
} as const;

export type RecurrenceRuleApi = typeof recurrenceRuleApi;
