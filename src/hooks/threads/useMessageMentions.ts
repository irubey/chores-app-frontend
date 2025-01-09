import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import {
  MentionWithUser,
  CreateMentionDTO,
  User,
  MentionUpdateEvent,
  Mention,
} from "@shared/types";
import { MessageAction } from "@shared/enums/messages";
import { logger } from "@/lib/api/logger";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
// import { useSocket } from "@/contexts/SocketContext";
import { useEffect } from "react";
// import { socketClient } from "@/lib/socketClient";
import { useAuth } from "@/contexts/UserContext";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";
import { useUser } from "@/hooks/users/useUser";

// Constants
const TEMP_ID_PREFIX = "temp-mention-";
const SOCKET_EVENT = {
  MENTIONS_UPDATE: (messageId: string) =>
    `message:${messageId}:mentions:update`,
} as const;

// Types
interface MessageOptions {
  readonly householdId: string;
  readonly threadId: string;
  readonly messageId: string;
  readonly enabled?: boolean;
}

interface MutationContext {
  readonly previousMentions: readonly MentionWithUser[] | undefined;
}

interface OptimisticMentionUser extends Pick<User, "id" | "name" | "email"> {
  readonly profileImageURL: null;
  readonly activeHouseholdId: null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface UseMessageMentionsResult {
  data: readonly MentionWithUser[] | undefined;
  isLoading: boolean;
  error: Error | null;
  addMention: ReturnType<typeof useMessageMentions>["addMention"];
  removeMention: ReturnType<typeof useMessageMentions>["removeMention"];
  prefetchMentions: () => Promise<void>;
  invalidateMentions: () => Promise<void>;
}

/**
 * Hook for managing message mentions with real-time updates
 */
export const useMessageMentions = (
  { householdId, threadId, messageId, enabled = true }: MessageOptions,
  queryOptions?: Omit<
    UseQueryOptions<readonly MentionWithUser[]>,
    "queryKey" | "queryFn"
  >
) => {
  const queryClient = useQueryClient();
  // const { isConnected } = useSocket();
  const { status, isLoading: isAuthLoading } = useAuth();
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      data: undefined,
      isLoading: true,
      error: null,
      addMention: async () => {},
      removeMention: async () => {},
      prefetchMentions: async () => {},
      invalidateMentions: async () => {},
    };
  }

  if (status !== "authenticated") {
    return {
      data: undefined,
      isLoading: false,
      error: null,
      addMention: async () => {},
      removeMention: async () => {},
      prefetchMentions: async () => {},
      invalidateMentions: async () => {},
    };
  }

  useEffect(() => {
    if (!enabled || status !== "authenticated") return;

    const handleMentionsUpdate = (event: MentionUpdateEvent) => {
      queryClient.setQueryData<readonly MentionWithUser[]>(
        threadKeys.messages.mentions(householdId, threadId, messageId),
        (old) => {
          if (!old) return old;
          if (event.action === MessageAction.MENTIONED) {
            return [...old, event.mention];
          }
          if (event.action === MessageAction.DELETED) {
            return old.filter((m) => m.id !== event.mention.id);
          }
          return old;
        }
      );
      logger.debug("Mentions updated via socket", {
        messageId,
        threadId,
        householdId,
        action: event.action,
      });
    };

    const eventName = SOCKET_EVENT.MENTIONS_UPDATE(messageId);
    // socketClient.on(eventName, handleMentionsUpdate);
    logger.debug("Subscribed to mentions updates", {
      messageId,
      threadId,
      householdId,
      event: eventName,
    });

    return () => {
      // socketClient.off(eventName, handleMentionsUpdate);
      logger.debug("Unsubscribed from mentions updates", {
        messageId,
        threadId,
        householdId,
        event: eventName,
      });
    };
  }, [
    // isConnected,
    messageId,
    enabled,
    status,
    queryClient,
    householdId,
    threadId,
  ]);

  const query = useQuery({
    queryKey: threadKeys.messages.mentions(householdId, threadId, messageId),
    queryFn: async () => {
      try {
        const result = await threadApi.messages.mentions.getMessageMentions(
          householdId,
          threadId,
          messageId
        );
        logger.debug("Message mentions fetched", {
          messageId,
          threadId,
          householdId,
          mentionsCount: result.data.length,
        });
        return result.data;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.type === ApiErrorType.UNAUTHORIZED
        ) {
          logger.error("Unauthorized to fetch mentions", {
            messageId,
            threadId,
            householdId,
          });
        } else {
          logger.error("Failed to fetch mentions", {
            messageId,
            threadId,
            householdId,
            error,
          });
        }
        throw error;
      }
    },
    staleTime: STALE_TIMES.SHORT,
    gcTime: CACHE_TIMES.STANDARD,
    enabled:
      enabled &&
      status === "authenticated" &&
      Boolean(messageId) &&
      Boolean(threadId) &&
      Boolean(householdId),
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        error.type === ApiErrorType.UNAUTHORIZED
      ) {
        return false;
      }
      return failureCount < 3;
    },
    ...queryOptions,
  });

  const addMention = useMutation<
    MentionWithUser,
    Error,
    CreateMentionDTO,
    MutationContext
  >({
    mutationFn: async (data) => {
      if (!currentUser) {
        throw new Error("User must be logged in to add mentions");
      }

      try {
        const result = await threadApi.messages.mentions.createMention(
          householdId,
          threadId,
          messageId,
          data
        );
        logger.info("Mention added", {
          messageId,
          threadId,
          householdId,
          userId: data.userId,
        });
        return result.data;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.type === ApiErrorType.UNAUTHORIZED
        ) {
          logger.error("Unauthorized to add mention", {
            messageId,
            threadId,
            householdId,
            userId: data.userId,
          });
        } else {
          logger.error("Failed to add mention", {
            messageId,
            threadId,
            householdId,
            error,
          });
        }
        throw error;
      }
    },
    onMutate: async (data) => {
      if (!currentUser) return;

      await queryClient.cancelQueries({
        queryKey: threadKeys.messages.mentions(
          householdId,
          threadId,
          messageId
        ),
      });

      const previousMentions = queryClient.getQueryData<
        readonly MentionWithUser[]
      >(threadKeys.messages.mentions(householdId, threadId, messageId));

      if (currentUser) {
        const now = new Date();
        const optimisticUser: OptimisticMentionUser = {
          id: data.userId,
          name: currentUser.name,
          email: currentUser.email,
          profileImageURL: null,
          activeHouseholdId: null,
          createdAt: now,
          updatedAt: now,
        };

        const optimisticMention: MentionWithUser = {
          id: `${TEMP_ID_PREFIX}${Date.now()}`,
          userId: data.userId,
          messageId,
          mentionedAt: now,
          user: optimisticUser,
        };

        queryClient.setQueryData<readonly MentionWithUser[]>(
          threadKeys.messages.mentions(householdId, threadId, messageId),
          (old) => (old ? [...old, optimisticMention] : [optimisticMention])
        );

        logger.debug("Applied optimistic mention update", {
          messageId,
          threadId,
          householdId,
          mentionId: optimisticMention.id,
        });
      }

      return { previousMentions };
    },
    onError: (error, __, context) => {
      if (context?.previousMentions) {
        queryClient.setQueryData(
          threadKeys.messages.mentions(householdId, threadId, messageId),
          context.previousMentions
        );
        logger.debug("Rolled back optimistic mention update", {
          messageId,
          threadId,
          householdId,
          error,
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.mentions(
          householdId,
          threadId,
          messageId
        ),
      });
    },
  });

  const removeMention = useMutation<void, Error, string, MutationContext>({
    mutationFn: async (mentionId) => {
      if (!currentUser) {
        throw new Error("User must be logged in to remove mentions");
      }

      try {
        await threadApi.messages.mentions.removeMention(
          householdId,
          threadId,
          messageId,
          mentionId
        );
        logger.info("Mention removed", {
          messageId,
          threadId,
          householdId,
          mentionId,
        });
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.type === ApiErrorType.UNAUTHORIZED
        ) {
          logger.error("Unauthorized to remove mention", {
            messageId,
            threadId,
            householdId,
            mentionId,
          });
        } else {
          logger.error("Failed to remove mention", {
            messageId,
            threadId,
            householdId,
            mentionId,
            error,
          });
        }
        throw error;
      }
    },
    onMutate: async (mentionId) => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.messages.mentions(
          householdId,
          threadId,
          messageId
        ),
      });

      const previousMentions = queryClient.getQueryData<
        readonly MentionWithUser[]
      >(threadKeys.messages.mentions(householdId, threadId, messageId));

      queryClient.setQueryData<readonly MentionWithUser[]>(
        threadKeys.messages.mentions(householdId, threadId, messageId),
        (old) => (old ? old.filter((m) => m.id !== mentionId) : [])
      );

      logger.debug("Applied optimistic mention removal", {
        messageId,
        threadId,
        householdId,
        mentionId,
      });

      return { previousMentions };
    },
    onError: (error, mentionId, context) => {
      if (context?.previousMentions) {
        queryClient.setQueryData(
          threadKeys.messages.mentions(householdId, threadId, messageId),
          context.previousMentions
        );
        logger.debug("Rolled back optimistic mention removal", {
          messageId,
          threadId,
          householdId,
          mentionId,
          error,
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.mentions(
          householdId,
          threadId,
          messageId
        ),
      });
    },
  });

  const prefetchMentions = async () => {
    if (status !== "authenticated") return;

    return queryClient.prefetchQuery({
      queryKey: threadKeys.messages.mentions(householdId, threadId, messageId),
      queryFn: () =>
        threadApi.messages.mentions.getMessageMentions(
          householdId,
          threadId,
          messageId
        ),
    });
  };

  const invalidateMentions = async () => {
    if (status !== "authenticated") return;

    await queryClient.invalidateQueries({
      queryKey: threadKeys.messages.mentions(householdId, threadId, messageId),
    });
  };

  return {
    ...query,
    addMention,
    removeMention,
    prefetchMentions,
    invalidateMentions,
  };
};

/**
 * Utility functions for working with mentions
 */
export const mentionUtils = {
  isMentioned: (
    mentions: readonly MentionWithUser[] | undefined,
    userId: string
  ): boolean => {
    if (!mentions) return false;
    return mentions.some((m) => m.userId === userId);
  },

  getMention: (
    mentions: readonly MentionWithUser[] | undefined,
    userId: string
  ): MentionWithUser | undefined => {
    if (!mentions) return undefined;
    return mentions.find((m) => m.userId === userId);
  },

  getMentionedUsers: (
    mentions: readonly MentionWithUser[] | undefined
  ): readonly string[] => {
    if (!mentions) return [];
    return mentions.map((m) => m.userId);
  },

  getMentionsByUser: (
    mentions: readonly MentionWithUser[] | undefined,
    userId: string
  ): readonly MentionWithUser[] => {
    if (!mentions) return [];
    return mentions.filter((m) => m.userId === userId);
  },

  sortMentionsByDate: (
    mentions: readonly MentionWithUser[] | undefined
  ): readonly MentionWithUser[] => {
    if (!mentions) return [];
    return [...mentions].sort(
      (a, b) =>
        new Date(b.mentionedAt).getTime() - new Date(a.mentionedAt).getTime()
    );
  },

  filterMentionsByDate: (
    mentions: readonly MentionWithUser[] | undefined,
    startDate: Date,
    endDate: Date
  ): readonly MentionWithUser[] => {
    if (!mentions) return [];
    return mentions.filter((m) => {
      const date = new Date(m.mentionedAt);
      return date >= startDate && date <= endDate;
    });
  },
};
