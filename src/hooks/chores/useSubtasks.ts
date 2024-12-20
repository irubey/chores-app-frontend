import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { choreApi, choreKeys } from "@/lib/api/services/choreService";
import { CreateSubtaskDTO, UpdateSubtaskDTO, Subtask } from "@shared/types";
import { SubtaskStatus } from "@shared/enums";

export function useSubtasks(householdId: string, choreId: string) {
  const queryClient = useQueryClient();

  const subtasksQuery = useQuery({
    queryKey: choreKeys.subtasks.all(householdId, choreId),
    queryFn: () => choreApi.subtasks.list(householdId, choreId),
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (data: CreateSubtaskDTO) =>
      choreApi.subtasks.create(householdId, choreId, data),
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

      return { previousSubtasks };
    },
    onError: (err, newSubtask, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          choreKeys.subtasks.all(householdId, choreId),
          context.previousSubtasks
        );
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
    mutationFn: ({
      subtaskId,
      data,
    }: {
      subtaskId: string;
      data: UpdateSubtaskDTO;
    }) => choreApi.subtasks.update(householdId, choreId, subtaskId, data),
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
      }

      return { previousSubtasks };
    },
    onError: (err, { subtaskId }, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          choreKeys.subtasks.all(householdId, choreId),
          context.previousSubtasks
        );
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
    mutationFn: (subtaskId: string) =>
      choreApi.subtasks.delete(householdId, choreId, subtaskId),
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
      }

      return { previousSubtasks };
    },
    onError: (err, subtaskId, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          choreKeys.subtasks.all(householdId, choreId),
          context.previousSubtasks
        );
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
