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

export const useRecurrenceRules = () => {
  const queryClient = useQueryClient();

  const {
    data: recurrenceRules,
    isLoading: isLoadingRules,
    error: rulesError,
  } = useQuery({
    queryKey: recurrenceRuleKeys.list(),
    queryFn: async () => {
      const response = await recurrenceRuleApi.list();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRecurrenceRuleDTO) => {
      const response = await recurrenceRuleApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceRuleKeys.all });
      logger.debug("Successfully created recurrence rule");
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
      const response = await recurrenceRuleApi.update(ruleId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceRuleKeys.all });
      logger.debug("Successfully updated recurrence rule");
    },
    onError: (error) => {
      logger.error("Failed to update recurrence rule", { error });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      await recurrenceRuleApi.delete(ruleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceRuleKeys.all });
      logger.debug("Successfully deleted recurrence rule");
    },
    onError: (error) => {
      logger.error("Failed to delete recurrence rule", { error });
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
  const {
    data: rule,
    isLoading,
    error,
  } = useQuery({
    queryKey: recurrenceRuleKeys.detail(ruleId),
    queryFn: async () => {
      const response = await recurrenceRuleApi.get(ruleId);
      return response.data;
    },
    enabled: !!ruleId,
  });

  return {
    rule,
    isLoading,
    error,
  };
};
