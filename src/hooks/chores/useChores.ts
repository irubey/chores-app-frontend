import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { choreApi, choreKeys } from "@/lib/api/services/choreService";
import {
  CreateChoreDTO,
  UpdateChoreDTO,
  ChoreWithAssignees,
} from "@shared/types";
import { ChoreStatus } from "@shared/enums";
import { useAuth } from "@/contexts/UserContext";
import { logger } from "@/lib/api/logger";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";

export function useChores(householdId: string) {
  const { status, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      chores: [],
      isLoading: true,
      isError: false,
      error: null,
      createChore: async () => {},
      updateChore: async () => {},
      deleteChore: async () => {},
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    };
  }

  if (status !== "authenticated") {
    return {
      chores: [],
      isLoading: false,
      isError: false,
      error: null,
      createChore: async () => {},
      updateChore: async () => {},
      deleteChore: async () => {},
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    };
  }

  const choresQuery = useQuery({
    queryKey: choreKeys.list(householdId),
    queryFn: async () => {
      try {
        const result = await choreApi.chores.list(householdId);
        logger.debug("Chores list fetched", { householdId });
        return result;
      } catch (error) {
        logger.error("Failed to fetch chores list", { error, householdId });
        throw error;
      }
    },
    enabled: status === "authenticated" && !!householdId,
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

  const createChoreMutation = useMutation({
    mutationFn: async (data: CreateChoreDTO) => {
      try {
        const result = await choreApi.chores.create(householdId, data);
        logger.debug("Chore created", { householdId, choreData: data });
        return result;
      } catch (error) {
        logger.error("Failed to create chore", { error, householdId, data });
        throw error;
      }
    },
    onMutate: async (newChore) => {
      await queryClient.cancelQueries({ queryKey: choreKeys.lists() });

      const previousChores = queryClient.getQueryData<{
        data: ChoreWithAssignees[];
      }>(choreKeys.list(householdId));

      const optimisticChore: ChoreWithAssignees = {
        id: "temp-id",
        householdId,
        title: newChore.title,
        description: newChore.description,
        status: newChore.status ?? ChoreStatus.PENDING,
        priority: newChore.priority,
        dueDate: newChore.dueDate,
        recurrenceRuleId: newChore.recurrenceRuleId,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignments: [],
        subtasks: [],
        deletedAt: null,
      };

      queryClient.setQueryData(choreKeys.list(householdId), {
        data: [...(previousChores?.data || []), optimisticChore],
      });

      logger.debug("Optimistic chore update applied", {
        householdId,
        choreId: optimisticChore.id,
      });

      return { previousChores };
    },
    onError: (err, newChore, context) => {
      if (context?.previousChores) {
        queryClient.setQueryData(
          choreKeys.list(householdId),
          context.previousChores
        );
        logger.debug("Rolled back optimistic chore creation", { householdId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: choreKeys.lists() });
    },
  });

  const updateChoreMutation = useMutation({
    mutationFn: async ({
      choreId,
      data,
    }: {
      choreId: string;
      data: UpdateChoreDTO;
    }) => {
      try {
        const result = await choreApi.chores.update(householdId, choreId, data);
        logger.debug("Chore updated", {
          householdId,
          choreId,
          updateData: data,
        });
        return result;
      } catch (error) {
        logger.error("Failed to update chore", {
          error,
          householdId,
          choreId,
          data,
        });
        throw error;
      }
    },
    onMutate: async ({ choreId, data }) => {
      await queryClient.cancelQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });

      const previousChore = queryClient.getQueryData<{
        data: ChoreWithAssignees;
      }>(choreKeys.detail(householdId, choreId));

      // Update in detail view
      if (previousChore?.data) {
        queryClient.setQueryData(choreKeys.detail(householdId, choreId), {
          data: { ...previousChore.data, ...data, updatedAt: new Date() },
        });
      }

      // Update in list view
      const previousChores = queryClient.getQueryData<{
        data: ChoreWithAssignees[];
      }>(choreKeys.list(householdId));

      if (previousChores?.data) {
        const updatedChores = previousChores.data.map((chore) =>
          chore.id === choreId
            ? { ...chore, ...data, updatedAt: new Date() }
            : chore
        );
        queryClient.setQueryData(choreKeys.list(householdId), {
          data: updatedChores,
        });
      }

      logger.debug("Optimistic chore update applied", { householdId, choreId });
      return { previousChore, previousChores };
    },
    onError: (err, { choreId }, context) => {
      if (context?.previousChore) {
        queryClient.setQueryData(
          choreKeys.detail(householdId, choreId),
          context.previousChore
        );
      }
      if (context?.previousChores) {
        queryClient.setQueryData(
          choreKeys.list(householdId),
          context.previousChores
        );
      }
      logger.debug("Rolled back optimistic chore update", {
        householdId,
        choreId,
      });
    },
    onSuccess: (_, { choreId }) => {
      queryClient.invalidateQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });
      queryClient.invalidateQueries({ queryKey: choreKeys.lists() });
    },
  });

  const deleteChoreMutation = useMutation({
    mutationFn: async (choreId: string) => {
      try {
        const result = await choreApi.chores.delete(householdId, choreId);
        logger.debug("Chore deleted", { householdId, choreId });
        return result;
      } catch (error) {
        logger.error("Failed to delete chore", { error, householdId, choreId });
        throw error;
      }
    },
    onMutate: async (choreId) => {
      await queryClient.cancelQueries({ queryKey: choreKeys.lists() });

      const previousChores = queryClient.getQueryData<{
        data: ChoreWithAssignees[];
      }>(choreKeys.list(householdId));

      if (previousChores?.data) {
        queryClient.setQueryData(choreKeys.list(householdId), {
          data: previousChores.data.filter((chore) => chore.id !== choreId),
        });
        logger.debug("Optimistic chore deletion applied", {
          householdId,
          choreId,
        });
      }

      return { previousChores };
    },
    onError: (err, choreId, context) => {
      if (context?.previousChores) {
        queryClient.setQueryData(
          choreKeys.list(householdId),
          context.previousChores
        );
        logger.debug("Rolled back optimistic chore deletion", {
          householdId,
          choreId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: choreKeys.lists() });
    },
  });

  return {
    chores: choresQuery.data?.data ?? [],
    isLoading: choresQuery.isLoading,
    isError: choresQuery.isError,
    error: choresQuery.error,
    createChore: createChoreMutation.mutate,
    updateChore: updateChoreMutation.mutate,
    deleteChore: deleteChoreMutation.mutate,
    isCreating: createChoreMutation.isPending,
    isUpdating: updateChoreMutation.isPending,
    isDeleting: deleteChoreMutation.isPending,
  };
}
