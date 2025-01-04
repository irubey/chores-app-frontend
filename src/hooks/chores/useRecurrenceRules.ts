import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  recurrenceRuleApi,
  recurrenceRuleKeys,
} from "@/lib/api/services/recurrenceRuleService";
import {
  CreateRecurrenceRuleDTO,
  UpdateRecurrenceRuleDTO,
} from "@shared/types";
import { logger } from "@/lib/api/logger";
import { useAuth } from "@/contexts/UserContext";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";

export const useRecurrenceRules = () => {
  const { status, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      recurrenceRules: [],
      isLoadingRules: true,
      rulesError: null,
      createRule: async () => {},
      updateRule: async () => {},
      deleteRule: async () => {},
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      createError: null,
      updateError: null,
      deleteError: null,
    };
  }

  if (status !== "authenticated") {
    return {
      recurrenceRules: [],
      isLoadingRules: false,
      rulesError: null,
      createRule: async () => {},
      updateRule: async () => {},
      deleteRule: async () => {},
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      createError: null,
      updateError: null,
      deleteError: null,
    };
  }

  const {
    data: recurrenceRules,
    isLoading: isLoadingRules,
    error: rulesError,
  } = useQuery({
    queryKey: recurrenceRuleKeys.list(),
    queryFn: async () => {
      try {
        const response = await recurrenceRuleApi.list();
        logger.debug("Recurrence rules fetched", {
          count: response.data.length,
        });
        return response.data;
      } catch (error) {
        logger.error("Failed to fetch recurrence rules", { error });
        throw error;
      }
    },
    enabled: status === "authenticated",
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        error.type === ApiErrorType.UNAUTHORIZED
      ) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 30000, // 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRecurrenceRuleDTO) => {
      try {
        const response = await recurrenceRuleApi.create(data);
        logger.debug("Recurrence rule created", {
          ruleId: response.data.id,
          data,
        });
        return response.data;
      } catch (error) {
        logger.error("Failed to create recurrence rule", { error, data });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: recurrenceRuleKeys.all });
      logger.debug("Successfully created recurrence rule", { ruleId: data.id });
    },
    onError: (error) => {
      logger.error("Failed to create recurrence rule", { error });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      ruleId,
      data,
    }: {
      ruleId: string;
      data: UpdateRecurrenceRuleDTO;
    }) => {
      try {
        const response = await recurrenceRuleApi.update(ruleId, data);
        logger.debug("Recurrence rule updated", { ruleId, data });
        return response.data;
      } catch (error) {
        logger.error("Failed to update recurrence rule", {
          error,
          ruleId,
          data,
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: recurrenceRuleKeys.all });
      logger.debug("Successfully updated recurrence rule", { ruleId: data.id });
    },
    onError: (error) => {
      logger.error("Failed to update recurrence rule", { error });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      try {
        await recurrenceRuleApi.delete(ruleId);
        logger.debug("Recurrence rule deleted", { ruleId });
      } catch (error) {
        logger.error("Failed to delete recurrence rule", { error, ruleId });
        throw error;
      }
    },
    onSuccess: (_, ruleId) => {
      queryClient.invalidateQueries({ queryKey: recurrenceRuleKeys.all });
      logger.debug("Successfully deleted recurrence rule", { ruleId });
    },
    onError: (error, ruleId) => {
      logger.error("Failed to delete recurrence rule", { error, ruleId });
    },
  });

  return {
    recurrenceRules,
    isLoadingRules,
    rulesError,
    createRule: createMutation.mutateAsync,
    updateRule: updateMutation.mutateAsync,
    deleteRule: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};

export const useRecurrenceRule = (ruleId: string) => {
  const { status, isLoading: isAuthLoading } = useAuth();

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      rule: null,
      isLoading: true,
      error: null,
    };
  }

  if (status !== "authenticated") {
    return {
      rule: null,
      isLoading: false,
      error: null,
    };
  }

  const {
    data: rule,
    isLoading,
    error,
  } = useQuery({
    queryKey: recurrenceRuleKeys.detail(ruleId),
    queryFn: async () => {
      try {
        const response = await recurrenceRuleApi.get(ruleId);
        logger.debug("Recurrence rule fetched", { ruleId });
        return response.data;
      } catch (error) {
        logger.error("Failed to fetch recurrence rule", { error, ruleId });
        throw error;
      }
    },
    enabled: status === "authenticated" && !!ruleId,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        error.type === ApiErrorType.UNAUTHORIZED
      ) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 30000, // 30 seconds
  });

  return {
    rule,
    isLoading,
    error,
  };
};
