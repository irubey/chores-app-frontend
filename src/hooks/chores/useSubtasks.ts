import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { choreApi, choreKeys } from "@/lib/api/services/choreService";
import { CreateSubtaskDTO, UpdateSubtaskDTO, Subtask } from "@shared/types";
import { SubtaskStatus } from "@shared/enums";
import { useAuth } from "@/contexts/UserContext";
import { logger } from "@/lib/api/logger";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";

export function useSubtasks(householdId: string, choreId: string) {
  const { status, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      subtasks: [],
      isLoading: true,
      isError: false,
      error: null,
      createSubtask: async () => {},
      updateSubtask: async () => {},
      deleteSubtask: async () => {},
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    };
  }

  if (status !== "authenticated") {
    return {
      subtasks: [],
      isLoading: false,
      isError: false,
      error: null,
      createSubtask: async () => {},
      updateSubtask: async () => {},
      deleteSubtask: async () => {},
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    };
  }

  const subtasksQuery = useQuery({
    queryKey: choreKeys.subtasks.all(householdId, choreId),
    queryFn: async () => {
      try {
        const result = await choreApi.subtasks.list(householdId, choreId);
        logger.debug("Subtasks fetched", {
          householdId,
          choreId,
          count: result.data.length,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch subtasks", {
          error,
          householdId,
          choreId,
        });
        throw error;
      }
    },
    enabled: status === "authenticated" && !!householdId && !!choreId,
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

  const createSubtaskMutation = useMutation({
    mutationFn: async (data: CreateSubtaskDTO) => {
      try {
        const result = await choreApi.subtasks.create(
          householdId,
          choreId,
          data
        );
        logger.debug("Subtask created", {
          householdId,
          choreId,
          subtaskId: result.data.id,
        });
        return result;
      } catch (error) {
        logger.error("Failed to create subtask", {
          error,
          householdId,
          choreId,
          data,
        });
        throw error;
      }
    },
    onMutate: async (newSubtask) => {
      await queryClient.cancelQueries({
        queryKey: choreKeys.subtasks.all(householdId, choreId),
      });

      const previousSubtasks = queryClient.getQueryData<{
        data: Subtask[];
      }>(choreKeys.subtasks.all(householdId, choreId));

      const optimisticSubtask: Subtask = {
        id: "temp-id",
        choreId,
        title: newSubtask.title,
        description: newSubtask.description ?? null,
        status: newSubtask.status ?? SubtaskStatus.PENDING,
      };

      queryClient.setQueryData(choreKeys.subtasks.all(householdId, choreId), {
        data: [...(previousSubtasks?.data || []), optimisticSubtask],
      });

      logger.debug("Optimistic subtask update applied", {
        householdId,
        choreId,
        subtaskId: optimisticSubtask.id,
      });

      return { previousSubtasks };
    },
    onError: (err, newSubtask, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          choreKeys.subtasks.all(householdId, choreId),
          context.previousSubtasks
        );
        logger.debug("Rolled back optimistic subtask creation", {
          householdId,
          choreId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: choreKeys.subtasks.all(householdId, choreId),
      });
      queryClient.invalidateQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: async ({
      subtaskId,
      data,
    }: {
      subtaskId: string;
      data: UpdateSubtaskDTO;
    }) => {
      try {
        const result = await choreApi.subtasks.update(
          householdId,
          choreId,
          subtaskId,
          data
        );
        logger.debug("Subtask updated", {
          householdId,
          choreId,
          subtaskId,
          data,
        });
        return result;
      } catch (error) {
        logger.error("Failed to update subtask", {
          error,
          householdId,
          choreId,
          subtaskId,
          data,
        });
        throw error;
      }
    },
    onMutate: async ({ subtaskId, data }) => {
      await queryClient.cancelQueries({
        queryKey: choreKeys.subtasks.all(householdId, choreId),
      });

      const previousSubtasks = queryClient.getQueryData<{
        data: Subtask[];
      }>(choreKeys.subtasks.all(householdId, choreId));

      if (previousSubtasks?.data) {
        const updatedSubtasks = previousSubtasks.data.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, ...data } : subtask
        );

        queryClient.setQueryData(choreKeys.subtasks.all(householdId, choreId), {
          data: updatedSubtasks,
        });

        logger.debug("Optimistic subtask update applied", {
          householdId,
          choreId,
          subtaskId,
        });
      }

      return { previousSubtasks };
    },
    onError: (err, { subtaskId }, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          choreKeys.subtasks.all(householdId, choreId),
          context.previousSubtasks
        );
        logger.debug("Rolled back optimistic subtask update", {
          householdId,
          choreId,
          subtaskId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: choreKeys.subtasks.all(householdId, choreId),
      });
      queryClient.invalidateQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (subtaskId: string) => {
      try {
        const result = await choreApi.subtasks.delete(
          householdId,
          choreId,
          subtaskId
        );
        logger.debug("Subtask deleted", {
          householdId,
          choreId,
          subtaskId,
        });
        return result;
      } catch (error) {
        logger.error("Failed to delete subtask", {
          error,
          householdId,
          choreId,
          subtaskId,
        });
        throw error;
      }
    },
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({
        queryKey: choreKeys.subtasks.all(householdId, choreId),
      });

      const previousSubtasks = queryClient.getQueryData<{
        data: Subtask[];
      }>(choreKeys.subtasks.all(householdId, choreId));

      if (previousSubtasks?.data) {
        queryClient.setQueryData(choreKeys.subtasks.all(householdId, choreId), {
          data: previousSubtasks.data.filter(
            (subtask) => subtask.id !== subtaskId
          ),
        });
        logger.debug("Optimistic subtask deletion applied", {
          householdId,
          choreId,
          subtaskId,
        });
      }

      return { previousSubtasks };
    },
    onError: (err, subtaskId, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          choreKeys.subtasks.all(householdId, choreId),
          context.previousSubtasks
        );
        logger.debug("Rolled back optimistic subtask deletion", {
          householdId,
          choreId,
          subtaskId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: choreKeys.subtasks.all(householdId, choreId),
      });
      queryClient.invalidateQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });
    },
  });

  return {
    subtasks: subtasksQuery.data?.data ?? [],
    isLoading: subtasksQuery.isLoading,
    isError: subtasksQuery.isError,
    error: subtasksQuery.error,
    createSubtask: createSubtaskMutation.mutate,
    updateSubtask: updateSubtaskMutation.mutate,
    deleteSubtask: deleteSubtaskMutation.mutate,
    isCreating: createSubtaskMutation.isPending,
    isUpdating: updateSubtaskMutation.isPending,
    isDeleting: deleteSubtaskMutation.isPending,
  };
}
