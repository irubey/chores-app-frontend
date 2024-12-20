import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import {
  ThreadWithDetails,
  CreateThreadDTO,
  HouseholdMember,
  User,
  Household,
  MessageWithDetails,
  UpdateThreadDTO,
} from "@shared/types";
import { logger } from "@/lib/api/logger";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { useSocket } from "@/contexts/SocketContext";
import { socketClient } from "@/lib/socketClient";
import { ApiRequestOptions } from "@/lib/api/utils/apiUtils";
import { useUser } from "@/hooks/users/useUser";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";

// Types
interface ThreadsOptions {
  readonly householdId: string;
  readonly requestOptions?: ApiRequestOptions;
  readonly enabled?: boolean;
  readonly enableSockets?: boolean;
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

// Utility functions for accessing thread data
export const getThreadById = (
  threads: readonly ThreadWithDetails[] | undefined,
  threadId: string
): ThreadWithDetails | undefined =>
  threads?.find((thread) => thread.id === threadId);

export const getMessageById = (
  thread: ThreadWithDetails | undefined,
  messageId: string
): MessageWithDetails | undefined =>
  thread?.messages.find((message) => message.id === messageId);

export const getMessagesByThreadId = (
  threads: readonly ThreadWithDetails[] | undefined,
  threadId: string
): MessageWithDetails[] | undefined =>
  getThreadById(threads, threadId)?.messages;

/**
 * Hook for managing thread list with real-time updates and filtering
 */
export const useThreads = ({
  householdId,
  requestOptions,
  enabled = true,
  enableSockets = false,
}: ThreadsOptions) => {
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  const isActiveHousehold = currentUser?.activeHouseholdId === householdId;

  const query = useQuery({
    queryKey: threadKeys.list(householdId),
    queryFn: async () => {
      try {
        const result = await threadApi.threads.list(
          householdId,
          requestOptions
        );
        logger.debug("API Request: List Threads", {
          householdId,
          params: requestOptions,
          timestamp: new Date().toISOString(),
        });
        return result.data;
      } catch (error) {
        logger.error("Failed to fetch thread list", {
          householdId,
          params: requestOptions,
          error,
        });
        throw error;
      }
    },
    enabled: enabled && isActiveHousehold && !!householdId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
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
  });

  useEffect(() => {
    if (!isConnected || !enabled || !enableSockets) return;

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

    const handleParticipantAdd = (data: {
      threadId: string;
      participant: HouseholdMember;
    }) => {
      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) =>
          old?.map((thread) =>
            thread.id === data.threadId
              ? {
                  ...thread,
                  participants: [...thread.participants, data.participant],
                }
              : thread
          )
      );
    };

    const handleParticipantRemove = (data: {
      threadId: string;
      participantId: string;
    }) => {
      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) =>
          old?.map((thread) =>
            thread.id === data.threadId
              ? {
                  ...thread,
                  participants: thread.participants.filter(
                    (p) => p.id !== data.participantId
                  ),
                }
              : thread
          )
      );
    };

    // Subscribe to socket events
    socketClient.on("thread:create", handleThreadCreate);
    socketClient.on("thread:update", handleThreadUpdate);
    socketClient.on("thread:delete", handleThreadDelete);
    socketClient.on("thread:participant:add", handleParticipantAdd);
    socketClient.on("thread:participant:remove", handleParticipantRemove);

    logger.debug("Subscribed to thread list socket events", {
      householdId,
      events: [
        "thread:create",
        "thread:update",
        "thread:delete",
        "thread:participant:add",
        "thread:participant:remove",
      ],
    });

    return () => {
      // Cleanup socket subscriptions
      socketClient.off("thread:create", handleThreadCreate);
      socketClient.off("thread:update", handleThreadUpdate);
      socketClient.off("thread:delete", handleThreadDelete);
      socketClient.off("thread:participant:add", handleParticipantAdd);
      socketClient.off("thread:participant:remove", handleParticipantRemove);

      logger.debug("Unsubscribed from thread list socket events", {
        householdId,
      });
    };
  }, [isConnected, enabled, enableSockets]);

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

  const updateThread = useMutation<
    ThreadWithDetails,
    Error,
    UpdateThreadDTO & { threadId: string }
  >({
    mutationFn: async ({ threadId, ...data }) => {
      return threadApi.threads.update(householdId, threadId, data);
    },
    onSuccess: (updatedThread) => {
      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) =>
          old?.map((thread) =>
            thread.id === updatedThread.id ? updatedThread : thread
          )
      );
    },
  });

  const deleteThread = useMutation<void, Error, string>({
    mutationFn: async (threadId) => {
      await threadApi.threads.delete(householdId, threadId);
    },
    onSuccess: (_, threadId) => {
      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) => old?.filter((thread) => thread.id !== threadId)
      );
    },
  });

  const inviteToThread = useMutation<
    ThreadWithDetails,
    Error,
    { threadId: string; userIds: string[] }
  >({
    mutationFn: async ({ threadId, userIds }) => {
      const result = await threadApi.threads.invite(
        householdId,
        threadId,
        userIds
      );
      return result;
    },
    onSuccess: (updatedThread) => {
      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) =>
          old?.map((thread) =>
            thread.id === updatedThread.id ? updatedThread : thread
          )
      );
    },
  });

  const updateParticipants = useMutation<
    ThreadWithDetails,
    Error,
    { threadId: string; add?: string[]; remove?: string[] }
  >({
    mutationFn: async ({ threadId, ...data }) => {
      const result = await threadApi.threads.updateParticipants(
        householdId,
        threadId,
        data
      );
      return result.data;
    },
    onSuccess: (updatedThread) => {
      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) =>
          old?.map((thread) =>
            thread.id === updatedThread.id ? updatedThread : thread
          )
      );
    },
  });

  const prefetchThread = async (threadId: string) => {
    return queryClient.prefetchQuery({
      queryKey: threadKeys.detail(householdId, threadId),
      queryFn: () => threadApi.threads.get(householdId, threadId),
    });
  };

  const invalidateThread = async (threadId: string) => {
    await queryClient.invalidateQueries({
      queryKey: threadKeys.detail(householdId, threadId),
    });
  };

  const setThreadData = (threadId: string, data: ThreadWithDetails) => {
    queryClient.setQueryData(threadKeys.detail(householdId, threadId), data);
  };

  return {
    ...query,
    createThread,
    updateThread,
    deleteThread,
    inviteToThread,
    updateParticipants,
    prefetchThread,
    invalidateThread,
    setThreadData,
  };
};

export interface UseThreadsResult {
  data: readonly ThreadWithDetails[] | undefined;
  isLoading: boolean;
  error: Error | null;
  createThread: ReturnType<typeof useThreads>["createThread"];
  updateThread: ReturnType<typeof useThreads>["updateThread"];
  deleteThread: ReturnType<typeof useThreads>["deleteThread"];
  inviteToThread: ReturnType<typeof useThreads>["inviteToThread"];
  updateParticipants: ReturnType<typeof useThreads>["updateParticipants"];
  prefetchThread: ReturnType<typeof useThreads>["prefetchThread"];
  invalidateThread: ReturnType<typeof useThreads>["invalidateThread"];
  setThreadData: ReturnType<typeof useThreads>["setThreadData"];
}

export const useThread = (
  householdId: string,
  threadId: string,
  options?: Omit<UseQueryOptions<ThreadWithDetails>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: threadKeys.detail(householdId, threadId),
    queryFn: async () => {
      return threadApi.threads.get(householdId, threadId);
    },
    ...options,
  });
};
