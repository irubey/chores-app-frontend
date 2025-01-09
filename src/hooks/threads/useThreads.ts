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
  ReactionUpdateEvent,
} from "@shared/types";
import { MessageAction } from "@shared/enums/messages";
import { logger } from "@/lib/api/logger";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
// import { useSocket } from "@/contexts/SocketContext";
// import { socketClient } from "@/lib/socketClient";
import { ApiRequestOptions } from "@/lib/api/utils/apiUtils";
import { useUser } from "@/hooks/users/useUser";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";
import { useAuth } from "@/contexts/UserContext";

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
  // const { isConnected } = useSocket();
  const { data: userData } = useUser();
  const currentUser = userData?.data;
  const { status, isLoading: isAuthLoading } = useAuth();

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      createThread: async () => {},
      updateThread: async () => {},
      deleteThread: async () => {},
      inviteToThread: async () => {},
      updateParticipants: async () => {},
      prefetchThread: async () => {},
      invalidateThread: async () => {},
      setThreadData: () => {},
    };
  }

  if (status !== "authenticated") {
    return {
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      createThread: async () => {},
      updateThread: async () => {},
      deleteThread: async () => {},
      inviteToThread: async () => {},
      updateParticipants: async () => {},
      prefetchThread: async () => {},
      invalidateThread: async () => {},
      setThreadData: () => {},
    };
  }

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
        if (
          error instanceof ApiError &&
          error.type === ApiErrorType.UNAUTHORIZED
        ) {
          logger.error("Unauthorized to fetch thread list", {
            householdId,
            params: requestOptions,
          });
        } else {
          logger.error("Failed to fetch thread list", {
            householdId,
            params: requestOptions,
            error,
          });
        }
        throw error;
      }
    },
    enabled:
      enabled &&
      isActiveHousehold &&
      !!householdId &&
      status === "authenticated",
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
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
    if (!enabled || !enableSockets || status !== "authenticated") return;

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

    const handleReactionUpdate = (data: ReactionUpdateEvent) => {
      queryClient.setQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId),
        (old) =>
          old?.map((thread) =>
            thread.messages.some((m) => m.id === data.messageId)
              ? {
                  ...thread,
                  messages: thread.messages.map((m) =>
                    m.id === data.messageId
                      ? {
                          ...m,
                          reactions:
                            data.action === MessageAction.REACTION_ADDED &&
                            data.reaction
                              ? [...m.reactions, data.reaction]
                              : data.action === MessageAction.REACTION_REMOVED
                              ? m.reactions.filter(
                                  (r) => r.id !== data.reactionId
                                )
                              : m.reactions,
                        }
                      : m
                  ),
                }
              : thread
          )
      );
    };

    // Subscribe to socket events
    // socketClient.on("reaction_update", handleReactionUpdate);
    // socketClient.on("thread:create", handleThreadCreate);
    // socketClient.on("thread:update", handleThreadUpdate);
    // socketClient.on("thread:delete", handleThreadDelete);
    // socketClient.on("thread:participant:add", handleParticipantAdd);
    // socketClient.on("thread:participant:remove", handleParticipantRemove);

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
      // socketClient.off("reaction_update", handleReactionUpdate);
      // socketClient.off("thread:create", handleThreadCreate);
      // socketClient.off("thread:update", handleThreadUpdate);
      // socketClient.off("thread:delete", handleThreadDelete);
      // socketClient.off("thread:participant:add", handleParticipantAdd);
      // socketClient.off("thread:participant:remove", handleParticipantRemove);

      logger.debug("Unsubscribed from thread list socket events", {
        householdId,
      });
    };
  }, [enabled, enableSockets, householdId, queryClient, status]);

  const createThread = useMutation<
    ThreadWithDetails,
    Error,
    CreateThreadDTO,
    MutationContext
  >({
    mutationFn: async (data) => {
      if (!currentUser) {
        throw new Error("User must be logged in to create threads");
      }

      try {
        const result = await threadApi.threads.create(householdId, data);
        logger.info("Thread created", {
          threadId: result.id,
          householdId,
          title: data.title,
        });
        return result;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.type === ApiErrorType.UNAUTHORIZED
        ) {
          logger.error("Unauthorized to create thread", {
            householdId,
          });
        } else {
          logger.error("Failed to create thread", {
            householdId,
            error,
          });
        }
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
    if (status !== "authenticated") return;

    return queryClient.prefetchQuery({
      queryKey: threadKeys.detail(householdId, threadId),
      queryFn: () => threadApi.threads.get(householdId, threadId),
    });
  };

  const invalidateThread = async (threadId: string) => {
    if (status !== "authenticated") return;

    await queryClient.invalidateQueries({
      queryKey: threadKeys.detail(householdId, threadId),
    });
  };

  const setThreadData = (threadId: string, data: ThreadWithDetails) => {
    if (status !== "authenticated") return;

    queryClient.setQueryData(threadKeys.detail(householdId, threadId), data);
  };

  return {
    ...query,
    createThread: createThread.mutateAsync,
    updateThread: updateThread.mutateAsync,
    deleteThread: deleteThread.mutateAsync,
    inviteToThread: inviteToThread.mutateAsync,
    updateParticipants: updateParticipants.mutateAsync,
    prefetchThread,
    invalidateThread,
    setThreadData,
  };
};

export interface UseThreadsResult {
  data: readonly ThreadWithDetails[] | undefined;
  isLoading: boolean;
  error: Error | null;
  createThread: (data: CreateThreadDTO) => Promise<ThreadWithDetails>;
  updateThread: (
    data: UpdateThreadDTO & { threadId: string }
  ) => Promise<ThreadWithDetails>;
  deleteThread: (threadId: string) => Promise<void>;
  inviteToThread: (data: {
    threadId: string;
    userIds: string[];
  }) => Promise<ThreadWithDetails>;
  updateParticipants: (data: {
    threadId: string;
    add?: string[];
    remove?: string[];
  }) => Promise<ThreadWithDetails>;
  prefetchThread: (threadId: string) => Promise<void>;
  invalidateThread: (threadId: string) => Promise<void>;
  setThreadData: (threadId: string, data: ThreadWithDetails) => void;
}

export const useThread = (
  householdId: string,
  threadId: string,
  options?: Omit<UseQueryOptions<ThreadWithDetails>, "queryKey" | "queryFn">
) => {
  const { status, isLoading: isAuthLoading } = useAuth();

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
    };
  }

  if (status !== "authenticated") {
    return {
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
    };
  }

  return useQuery({
    queryKey: threadKeys.detail(householdId, threadId),
    queryFn: async () => {
      try {
        const result = await threadApi.threads.get(householdId, threadId);
        logger.debug("Thread details fetched", {
          threadId,
          householdId,
        });
        return result;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.type === ApiErrorType.UNAUTHORIZED
        ) {
          logger.error("Unauthorized to fetch thread details", {
            threadId,
            householdId,
          });
        } else {
          logger.error("Failed to fetch thread details", {
            threadId,
            householdId,
            error,
          });
        }
        throw error;
      }
    },
    enabled: status === "authenticated" && !!householdId && !!threadId,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        error.type === ApiErrorType.UNAUTHORIZED
      ) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};
