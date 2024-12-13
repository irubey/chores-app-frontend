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
import { useSocket } from "@/contexts/SocketContext";
import { useEffect } from "react";
import { socketClient } from "@/lib/socketClient";
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
  const { isConnected } = useSocket();
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  useEffect(() => {
    if (!isConnected || !enabled) return;

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
    socketClient.on(eventName, handleMentionsUpdate);
    logger.debug("Subscribed to mentions updates", {
      messageId,
      threadId,
      householdId,
      event: eventName,
    });

    return () => {
      socketClient.off(eventName, handleMentionsUpdate);
      logger.debug("Unsubscribed from mentions updates", {
        messageId,
        threadId,
        householdId,
        event: eventName,
      });
    };
  }, [isConnected, messageId, enabled, queryClient, householdId, threadId]);

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
        logger.error("Failed to fetch mentions", {
          messageId,
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    staleTime: STALE_TIMES.SHORT,
    gcTime: CACHE_TIMES.STANDARD,
    enabled:
      enabled &&
      Boolean(messageId) &&
      Boolean(threadId) &&
      Boolean(householdId),
    ...queryOptions,
  });

  const addMention = useMutation<
    MentionWithUser,
    Error,
    CreateMentionDTO,
    MutationContext
  >({
    mutationFn: async (data) => {
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
        logger.error("Failed to add mention", {
          messageId,
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    onMutate: async (data) => {
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
      }

      return { previousMentions };
    },
    onError: (_, __, context) => {
      if (context?.previousMentions) {
        queryClient.setQueryData(
          threadKeys.messages.mentions(householdId, threadId, messageId),
          context.previousMentions
        );
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
        logger.error("Failed to remove mention", {
          messageId,
          threadId,
          householdId,
          mentionId,
          error,
        });
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

      return { previousMentions };
    },
    onError: (_, __, context) => {
      if (context?.previousMentions) {
        queryClient.setQueryData(
          threadKeys.messages.mentions(householdId, threadId, messageId),
          context.previousMentions
        );
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

  return {
    ...query,
    addMention,
    removeMention,
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
};
