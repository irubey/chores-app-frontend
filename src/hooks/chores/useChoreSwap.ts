import { useMutation, useQueryClient } from "@tanstack/react-query";
import { choreApi, choreKeys } from "@/lib/api/services/choreService";
import { ChoreWithAssignees, ChoreSwapRequest } from "@shared/types";
import { ChoreSwapRequestStatus } from "@shared/enums";
import { useAuth } from "@/contexts/UserContext";
import { logger } from "@/lib/api/logger";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";

export function useChoreSwap(householdId: string, choreId: string) {
  const { status, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      requestSwap: async () => {},
      handleSwapRequest: async () => {},
      isRequesting: false,
      isHandling: false,
      error: null,
    };
  }

  if (status !== "authenticated") {
    return {
      requestSwap: async () => {},
      handleSwapRequest: async () => {},
      isRequesting: false,
      isHandling: false,
      error: null,
    };
  }

  const createSwapRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      try {
        const result = await choreApi.swapRequests.create(
          householdId,
          choreId,
          targetUserId
        );
        logger.debug("Swap request created", {
          householdId,
          choreId,
          targetUserId,
        });
        return result;
      } catch (error) {
        logger.error("Failed to create swap request", {
          error,
          householdId,
          choreId,
          targetUserId,
        });
        throw error;
      }
    },
    onMutate: async (targetUserId) => {
      await queryClient.cancelQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });

      const previousChore = queryClient.getQueryData<{
        data: ChoreWithAssignees;
      }>(choreKeys.detail(householdId, choreId));

      if (previousChore?.data) {
        const now = new Date();
        const optimisticSwapRequest: ChoreSwapRequest = {
          id: "temp-id",
          choreId,
          requestingUserId: previousChore.data.assignments[0]?.userId ?? "",
          targetUserId,
          status: ChoreSwapRequestStatus.PENDING,
          createdAt: now,
          updatedAt: now,
        };

        queryClient.setQueryData(choreKeys.detail(householdId, choreId), {
          data: {
            ...previousChore.data,
            swapRequests: [
              ...(previousChore.data.swapRequests || []),
              optimisticSwapRequest,
            ],
          },
        });

        logger.debug("Optimistic swap request update applied", {
          householdId,
          choreId,
          requestId: optimisticSwapRequest.id,
        });
      }

      return { previousChore };
    },
    onError: (err, targetUserId, context) => {
      if (context?.previousChore) {
        queryClient.setQueryData(
          choreKeys.detail(householdId, choreId),
          context.previousChore
        );
        logger.debug("Rolled back optimistic swap request", {
          householdId,
          choreId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });
    },
  });

  const handleSwapRequestMutation = useMutation({
    mutationFn: async ({
      swapRequestId,
      approved,
    }: {
      swapRequestId: string;
      approved: boolean;
    }) => {
      try {
        const result = await choreApi.swapRequests.approveOrReject(
          householdId,
          choreId,
          swapRequestId,
          approved
        );
        logger.debug("Swap request handled", {
          householdId,
          choreId,
          swapRequestId,
          approved,
        });
        return result;
      } catch (error) {
        logger.error("Failed to handle swap request", {
          error,
          householdId,
          choreId,
          swapRequestId,
          approved,
        });
        throw error;
      }
    },
    onMutate: async ({ swapRequestId, approved }) => {
      await queryClient.cancelQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });

      const previousChore = queryClient.getQueryData<{
        data: ChoreWithAssignees;
      }>(choreKeys.detail(householdId, choreId));

      if (previousChore?.data) {
        const swapRequest = previousChore.data.swapRequests?.find(
          (req) => req.id === swapRequestId
        );

        if (swapRequest && approved) {
          // Update assignments optimistically
          const updatedAssignments = previousChore.data.assignments.map(
            (assignment) =>
              assignment.userId === swapRequest.requestingUserId
                ? { ...assignment, userId: swapRequest.targetUserId }
                : assignment
          );

          // Update swap request status
          const updatedSwapRequests = previousChore.data.swapRequests.map(
            (req) =>
              req.id === swapRequestId
                ? {
                    ...req,
                    status: approved
                      ? ChoreSwapRequestStatus.APPROVED
                      : ChoreSwapRequestStatus.REJECTED,
                  }
                : req
          );

          queryClient.setQueryData(choreKeys.detail(householdId, choreId), {
            data: {
              ...previousChore.data,
              assignments: updatedAssignments,
              swapRequests: updatedSwapRequests,
            },
          });

          logger.debug("Optimistic swap request handling applied", {
            householdId,
            choreId,
            swapRequestId,
            approved,
          });
        }
      }

      return { previousChore };
    },
    onError: (err, variables, context) => {
      if (context?.previousChore) {
        queryClient.setQueryData(
          choreKeys.detail(householdId, choreId),
          context.previousChore
        );
        logger.debug("Rolled back optimistic swap request handling", {
          householdId,
          choreId,
          swapRequestId: variables.swapRequestId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });
      queryClient.invalidateQueries({ queryKey: choreKeys.lists() });
    },
  });

  return {
    requestSwap: createSwapRequestMutation.mutate,
    handleSwapRequest: handleSwapRequestMutation.mutate,
    isRequesting: createSwapRequestMutation.isPending,
    isHandling: handleSwapRequestMutation.isPending,
    error: createSwapRequestMutation.error || handleSwapRequestMutation.error,
  };
}
