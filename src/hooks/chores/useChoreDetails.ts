import { useQuery, useQueryClient } from "@tanstack/react-query";
import { choreApi, choreKeys } from "@/lib/api/services/choreService";
import { ChoreWithAssignees } from "@shared/types";

export function useChoreDetails(householdId: string, choreId: string) {
  const queryClient = useQueryClient();

  const choreQuery = useQuery({
    queryKey: choreKeys.detail(householdId, choreId),
    queryFn: () => choreApi.chores.get(householdId, choreId),
  });

  const prefetchSubtasks = async () => {
    await queryClient.prefetchQuery({
      queryKey: choreKeys.subtasks.all(householdId, choreId),
      queryFn: () => choreApi.subtasks.list(householdId, choreId),
    });
  };

  const setChoreData = (data: ChoreWithAssignees) => {
    queryClient.setQueryData(choreKeys.detail(householdId, choreId), {
      data,
    });
  };

  return {
    chore: choreQuery.data?.data,
    isLoading: choreQuery.isLoading,
    isError: choreQuery.isError,
    error: choreQuery.error,
    prefetchSubtasks,
    setChoreData,
  };
}
