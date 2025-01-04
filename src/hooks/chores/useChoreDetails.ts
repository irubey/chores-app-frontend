import { useQuery, useQueryClient } from "@tanstack/react-query";
import { choreApi, choreKeys } from "@/lib/api/services/choreService";
import { ChoreWithAssignees } from "@shared/types";
import { useAuth } from "@/contexts/UserContext";
import { logger } from "@/lib/api/logger";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";

export function useChoreDetails(householdId: string, choreId: string) {
  const { status, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      chore: undefined,
      isLoading: true,
      isError: false,
      error: null,
      prefetchSubtasks: async () => {},
      setChoreData: () => {},
    };
  }

  if (status !== "authenticated") {
    return {
      chore: undefined,
      isLoading: false,
      isError: false,
      error: null,
      prefetchSubtasks: async () => {},
      setChoreData: () => {},
    };
  }

  const choreQuery = useQuery({
    queryKey: choreKeys.detail(householdId, choreId),
    queryFn: async () => {
      try {
        const result = await choreApi.chores.get(householdId, choreId);
        logger.debug("Chore details fetched", {
          choreId,
          householdId,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch chore details", {
          error,
          choreId,
          householdId,
        });
        throw error;
      }
    },
    enabled: status === "authenticated" && !!householdId && !!choreId,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
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

  const prefetchSubtasks = async () => {
    if (status !== "authenticated") return;

    try {
      await queryClient.prefetchQuery({
        queryKey: choreKeys.subtasks.all(householdId, choreId),
        queryFn: async () => {
          const result = await choreApi.subtasks.list(householdId, choreId);
          logger.debug("Prefetched chore subtasks", {
            choreId,
            householdId,
          });
          return result;
        },
      });
    } catch (error) {
      logger.error("Failed to prefetch subtasks", {
        error,
        choreId,
        householdId,
      });
    }
  };

  const setChoreData = (data: ChoreWithAssignees) => {
    if (status !== "authenticated") return;

    queryClient.setQueryData(choreKeys.detail(householdId, choreId), {
      data,
    });
    logger.debug("Chore data manually updated", {
      choreId,
      householdId,
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
