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
  CreateThreadDTO,
  HouseholdMember,
  User,
  Household,
  MessageWithDetails,
} from "@shared/types";
import { logger } from "@/lib/api/logger";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { useSocket } from "@/contexts/SocketContext";
import { socketClient } from "@/lib/socketClient";
import { ApiRequestOptions } from "@/lib/api/utils/apiUtils";
import { useUser } from "@/hooks/users/useUser";

// Types
interface ThreadsOptions {
  readonly householdId: string;
  readonly requestOptions?: ApiRequestOptions;
  readonly enabled?: boolean;
}

interface MutationContext {
  readonly previousThreads: readonly ThreadWithDetails[] | undefined;
}

interface OptimisticUser extends Pick<User, "id" | "name" | "email"> {
  readonly profileImageURL: null;
  readonly activeHouseholdId: null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface OptimisticHousehold
  extends Pick<
    Household,
    "id" | "name" | "currency" | "timezone" | "language"
  > {
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}

/**
 * Hook for managing thread list with real-time updates and filtering
 */
export const useThreads = (
  { householdId, requestOptions, enabled = true }: ThreadsOptions,
  options?: Omit<
    UseQueryOptions<readonly ThreadWithDetails[]>,
    "queryKey" | "queryFn"
  >
) => {
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  useEffect(() => {
    if (!isConnected || !enabled) return;

    const handleThreadCreate = (newThread: ThreadWithDetails) => {
      if (newThread.householdId !== householdId) return;

      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) => (old ? [newThread, ...old] : [newThread])
      );
      logger.debug("Thread created via socket", {
        threadId: newThread.id,
        householdId,
      });
    };

    const handleThreadUpdate = (updatedThread: ThreadWithDetails) => {
      if (updatedThread.householdId !== householdId) return;

      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) =>
          old
            ? old.map((thread) =>
                thread.id === updatedThread.id ? updatedThread : thread
              )
            : [updatedThread]
      );
      logger.debug("Thread updated via socket", {
        threadId: updatedThread.id,
        householdId,
      });
    };

    const handleThreadDelete = (threadId: string) => {
      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) => (old ? old.filter((thread) => thread.id !== threadId) : [])
      );
      logger.debug("Thread deleted via socket", {
        threadId,
        householdId,
      });
    };

    // Subscribe to socket events
    socketClient.on("thread:create", handleThreadCreate);
    socketClient.on("thread:update", handleThreadUpdate);
    socketClient.on("thread:delete", handleThreadDelete);

    logger.debug("Subscribed to thread list socket events", {
      householdId,
      events: ["thread:create", "thread:update", "thread:delete"],
    });

    return () => {
      // Cleanup socket subscriptions
      socketClient.off("thread:create", handleThreadCreate);
      socketClient.off("thread:update", handleThreadUpdate);
      socketClient.off("thread:delete", handleThreadDelete);

      logger.debug("Unsubscribed from thread list socket events", {
        householdId,
      });
    };
  }, [isConnected, householdId, enabled, queryClient]);

  const query = useQuery({
    queryKey: threadKeys.list(householdId),
    queryFn: async () => {
      try {
        const result = await threadApi.threads.list(
          householdId,
          requestOptions
        );
        logger.debug("Thread list fetched", {
          householdId,
          count: result.data.length,
          params: requestOptions?.params,
        });
        return result.data;
      } catch (error) {
        logger.error("Failed to fetch thread list", {
          householdId,
          params: requestOptions?.params,
          error,
        });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: enabled && Boolean(householdId),
    ...options,
  });

  const createThread = useMutation<
    ThreadWithDetails,
    Error,
    CreateThreadDTO,
    MutationContext
  >({
    mutationFn: async (data) => {
      try {
        const result = await threadApi.threads.create(householdId, data);
        logger.info("Thread created", {
          threadId: result.id,
          householdId,
          title: data.title,
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
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.list(householdId),
      });

      const previousThreads = queryClient.getQueryData<
        readonly ThreadWithDetails[]
      >(threadKeys.list(householdId));

      if (!currentUser) {
        return { previousThreads };
      }

      const now = new Date();
      const optimisticUser: OptimisticUser = {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        profileImageURL: null,
        activeHouseholdId: null,
        createdAt: now,
        updatedAt: now,
      };

      const optimisticHousehold: OptimisticHousehold = {
        id: householdId,
        name: "Loading...",
        currency: "USD",
        timezone: "UTC",
        language: "en",
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser.id,
      };

      const optimisticThread: ThreadWithDetails = {
        id: `temp-${now.getTime()}`,
        title: data.title || "",
        householdId,
        authorId: currentUser.id,
        createdAt: now,
        updatedAt: now,
        author: optimisticUser as User,
        household: optimisticHousehold as Household,
        participants: [],
        messages: [],
      };

      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) => (old ? [optimisticThread, ...old] : [optimisticThread])
      );

      return { previousThreads };
    },
    onError: (_, __, context) => {
      if (context?.previousThreads) {
        queryClient.setQueryData(
          threadKeys.list(householdId),
          context.previousThreads
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
    createThread,
  };
};
