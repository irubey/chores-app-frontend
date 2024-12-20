import { useMutation, useQueryClient } from "@tanstack/react-query";
import { choreApi, choreKeys } from "@/lib/api/services/choreService";
import { ChoreWithAssignees, ChoreSwapRequest } from "@shared/types";
import { ChoreSwapRequestStatus } from "@shared/enums";

export function useChoreSwap(householdId: string, choreId: string) {
  const queryClient = useQueryClient();

  const createSwapRequestMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      choreApi.swapRequests.create(householdId, choreId, targetUserId),
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
      }

      return { previousChore };
    },
    onError: (err, targetUserId, context) => {
      if (context?.previousChore) {
        queryClient.setQueryData(
          choreKeys.detail(householdId, choreId),
          context.previousChore
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: choreKeys.detail(householdId, choreId),
      });
    },
  });

  const handleSwapRequestMutation = useMutation({
    mutationFn: ({
      swapRequestId,
      approved,
    }: {
      swapRequestId: string;
      approved: boolean;
    }) =>
      choreApi.swapRequests.approveOrReject(
        householdId,
        choreId,
        swapRequestId,
        approved
      ),
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
