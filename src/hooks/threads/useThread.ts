// frontend/src/hooks/threads/useThread.ts
import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import {
  ThreadWithDetails,
  UpdateThreadDTO,
  HouseholdMember,
} from "@shared/types";
import { logger } from "@/lib/api/logger";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { useSocket } from "@/contexts/SocketContext";
import { socketClient } from "@/lib/socketClient";

// Types
interface ThreadOptions {
  readonly householdId: string;
  readonly threadId: string;
  readonly enabled?: boolean;
}

interface MutationContext {
  readonly previousThread: ThreadWithDetails | undefined;
}

interface OptimisticThreadUpdate
  extends Omit<ThreadWithDetails, "participants"> {
  participants: HouseholdMember[];
  updatedAt: Date;
}

/**
 * Hook for managing a single thread with real-time updates
 */
export const useThread = (
  { householdId, threadId, enabled = true }: ThreadOptions,
  options?: Omit<UseQueryOptions<ThreadWithDetails>, "queryKey" | "queryFn">
) => {
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !enabled) return;

    const handleThreadUpdate = (updatedThread: ThreadWithDetails) => {
      queryClient.setQueryData(
        threadKeys.detail(householdId, threadId),
        updatedThread
      );
      logger.debug("Thread updated via socket", {
        threadId,
        householdId,
      });
    };

    const handleThreadDelete = () => {
      queryClient.removeQueries({
        queryKey: threadKeys.detail(householdId, threadId),
      });
      logger.debug("Thread deleted via socket", {
        threadId,
        householdId,
      });
    };

    // Subscribe to socket events
    socketClient.on(`thread:${threadId}:update`, handleThreadUpdate);
    socketClient.on(`thread:${threadId}:delete`, handleThreadDelete);

    logger.debug("Subscribed to thread socket events", {
      threadId,
      householdId,
      events: [`thread:${threadId}:update`, `thread:${threadId}:delete`],
    });

    return () => {
      // Cleanup socket subscriptions
      socketClient.off(`thread:${threadId}:update`, handleThreadUpdate);
      socketClient.off(`thread:${threadId}:delete`, handleThreadDelete);

      logger.debug("Unsubscribed from thread socket events", {
        threadId,
        householdId,
      });
    };
  }, [isConnected, threadId, householdId, enabled, queryClient]);

  const query = useQuery({
    queryKey: threadKeys.detail(householdId, threadId),
    queryFn: async () => {
      try {
        const result = await threadApi.threads.get(householdId, threadId);
        logger.debug("Thread data fetched", {
          threadId,
          householdId,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch thread", {
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: enabled && Boolean(threadId) && Boolean(householdId),
    ...options,
  });

  const updateThread = useMutation<
    ThreadWithDetails,
    Error,
    UpdateThreadDTO,
    MutationContext
  >({
    mutationFn: async (data) => {
      try {
        const result = await threadApi.threads.update(
          householdId,
          threadId,
          data
        );
        logger.info("Thread updated", {
          threadId,
          householdId,
          updatedFields: Object.keys(data),
        });
        return result;
      } catch (error) {
        logger.error("Failed to update thread", {
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.detail(householdId, threadId),
      });

      const previousThread = queryClient.getQueryData<ThreadWithDetails>(
        threadKeys.detail(householdId, threadId)
      );

      if (previousThread) {
        const now = new Date();
        const optimisticThread: OptimisticThreadUpdate = {
          ...previousThread,
          ...data,
          participants: previousThread.participants,
          updatedAt: now,
        };

        queryClient.setQueryData<ThreadWithDetails>(
          threadKeys.detail(householdId, threadId),
          optimisticThread as ThreadWithDetails
        );
      }

      return { previousThread };
    },
    onError: (_, __, context) => {
      if (context?.previousThread) {
        queryClient.setQueryData(
          threadKeys.detail(householdId, threadId),
          context.previousThread
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.detail(householdId, threadId),
      });
    },
  });

  const deleteThread = useMutation<void, Error, void, MutationContext>({
    mutationFn: async () => {
      try {
        await threadApi.threads.delete(householdId, threadId);
        logger.info("Thread deleted", {
          threadId,
          householdId,
        });
      } catch (error) {
        logger.error("Failed to delete thread", {
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.detail(householdId, threadId),
      });

      const previousThread = queryClient.getQueryData<ThreadWithDetails>(
        threadKeys.detail(householdId, threadId)
      );

      queryClient.removeQueries({
        queryKey: threadKeys.detail(householdId, threadId),
      });

      return { previousThread };
    },
    onError: (_, __, context) => {
      if (context?.previousThread) {
        queryClient.setQueryData(
          threadKeys.detail(householdId, threadId),
          context.previousThread
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.list(householdId),
      });
    },
  });

  return {
    ...query,
    updateThread,
    deleteThread,
  };
};

export const useCreateThread = (
  householdId: string,
  options?: { onSuccess?: () => void }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title?: string;
      participants: string[];
      initialMessage: { content: string };
    }) => {
      try {
        const result = await threadApi.threads.create(householdId, data);
        logger.info("Thread created", {
          householdId,
          threadId: result.id,
        });
        return result;
      } catch (error) {
        logger.error("Failed to create thread", {
          householdId,
          error,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.list(householdId) });
      options?.onSuccess?.();
    },
  });
};
