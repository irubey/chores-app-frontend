import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { choreApi, choreKeys } from "@/lib/api/services/choreService";
import {
  CreateChoreDTO,
  UpdateChoreDTO,
  ChoreWithAssignees,
} from "@shared/types";
import { ChoreStatus } from "@shared/enums";

export function useChores(householdId: string) {
  const queryClient = useQueryClient();

  const choresQuery = useQuery({
    queryKey: choreKeys.list(householdId),
    queryFn: () => choreApi.chores.list(householdId),
  });

  const createChoreMutation = useMutation({
    mutationFn: (data: CreateChoreDTO) =>
      choreApi.chores.create(householdId, data),
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

      return { previousChores };
    },
    onError: (err, newChore, context) => {
      if (context?.previousChores) {
        queryClient.setQueryData(
          choreKeys.list(householdId),
          context.previousChores
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: choreKeys.lists() });
    },
  });

  const updateChoreMutation = useMutation({
    mutationFn: ({
      choreId,
      data,
    }: {
      choreId: string;
      data: UpdateChoreDTO;
    }) => choreApi.chores.update(householdId, choreId, data),
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
    },
    onSuccess: (_, { choreId }) => {
      queryClient.invalidateQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });
      queryClient.invalidateQueries({ queryKey: choreKeys.lists() });
    },
  });

  const deleteChoreMutation = useMutation({
    mutationFn: (choreId: string) =>
      choreApi.chores.delete(householdId, choreId),
    onMutate: async (choreId) => {
      await queryClient.cancelQueries({ queryKey: choreKeys.lists() });

      const previousChores = queryClient.getQueryData<{
        data: ChoreWithAssignees[];
      }>(choreKeys.list(householdId));

      if (previousChores?.data) {
        queryClient.setQueryData(choreKeys.list(householdId), {
          data: previousChores.data.filter((chore) => chore.id !== choreId),
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
