// frontend/src/hooks/threads/useMessageInteractions.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import {
  MessageWithDetails,
  UpdateMessageDTO,
  MessageReadStatus,
  MessageReadWithUser,
  ReactionWithUser,
  CreateReactionDTO,
  User,
  MessageUpdateEvent,
  ReactionUpdateEvent,
} from "@shared/types";
import { MessageAction, ReactionType } from "@shared/enums/messages";
import { logger } from "@/lib/api/logger";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect } from "react";
import { socketClient } from "@/lib/socketClient";
import { useUser } from "@/hooks/users/useUser";

// Types
interface MessageOptions {
  readonly householdId: string;
  readonly threadId: string;
  readonly messageId: string;
  readonly enabled?: boolean;
}

interface MutationContext {
  readonly previousMessage: MessageWithDetails | undefined;
}

interface MessageReadStatusUpdate {
  readonly isRead: boolean;
  readonly readAt: Date;
}

interface OptimisticReactionUser extends Pick<User, "id" | "name" | "email"> {
  readonly profileImageURL: null;
  readonly activeHouseholdId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Message hook with real-time updates
export const useMessage = (
  { householdId, threadId, messageId, enabled = true }: MessageOptions,
  options?: Omit<UseQueryOptions<MessageWithDetails>, "queryKey" | "queryFn">
) => {
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !enabled) return;

    const handleMessageUpdate = (event: MessageUpdateEvent) => {
      if (event.message) {
        queryClient.setQueryData(
          threadKeys.messages.detail(householdId, threadId, messageId),
          event.message
        );
        logger.debug("Message updated via socket", {
          messageId,
          threadId,
          householdId,
          action: event.action,
        });
      }
    };

    // Subscribe to socket events
    socketClient.on(`message:${messageId}:update`, handleMessageUpdate);
    logger.debug("Subscribed to message updates", {
      messageId,
      threadId,
      householdId,
    });

    return () => {
      socketClient.off(`message:${messageId}:update`, handleMessageUpdate);
      logger.debug("Unsubscribed from message updates", {
        messageId,
        threadId,
        householdId,
      });
    };
  }, [isConnected, messageId, enabled, queryClient, householdId, threadId]);

  const query = useQuery({
    queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
    queryFn: async () => {
      try {
        const result = await threadApi.messages.list(householdId, threadId);
        const message = result.data.find((m) => m.id === messageId);
        if (!message) {
          throw new Error("Message not found");
        }
        logger.debug("Message data fetched", {
          messageId,
          threadId,
          householdId,
        });
        return message;
      } catch (error) {
        logger.error("Failed to fetch message", {
          messageId,
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled:
      enabled &&
      Boolean(messageId) &&
      Boolean(threadId) &&
      Boolean(householdId),
    ...options,
  });

  const updateMessage = useMutation<
    MessageWithDetails,
    Error,
    UpdateMessageDTO,
    MutationContext
  >({
    mutationFn: async (data) => {
      try {
        const result = await threadApi.messages.update(
          householdId,
          threadId,
          messageId,
          data
        );
        logger.info("Message updated", {
          messageId,
          threadId,
          householdId,
          updatedFields: Object.keys(data),
        });
        return result;
      } catch (error) {
        logger.error("Failed to update message", {
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
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });

      const previousMessage = queryClient.getQueryData<MessageWithDetails>(
        threadKeys.messages.detail(householdId, threadId, messageId)
      );

      if (previousMessage) {
        const optimisticMessage: MessageWithDetails = {
          ...previousMessage,
          ...data,
          updatedAt: new Date(),
        };

        queryClient.setQueryData<MessageWithDetails>(
          threadKeys.messages.detail(householdId, threadId, messageId),
          optimisticMessage
        );
      }

      return { previousMessage };
    },
    onError: (_, __, context) => {
      if (context?.previousMessage) {
        queryClient.setQueryData(
          threadKeys.messages.detail(householdId, threadId, messageId),
          context.previousMessage
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });
    },
  });

  const deleteMessage = useMutation<void, Error, void, MutationContext>({
    mutationFn: async () => {
      try {
        await threadApi.messages.delete(householdId, threadId, messageId);
        logger.info("Message deleted", {
          messageId,
          threadId,
          householdId,
        });
      } catch (error) {
        logger.error("Failed to delete message", {
          messageId,
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });

      const previousMessage = queryClient.getQueryData<MessageWithDetails>(
        threadKeys.messages.detail(householdId, threadId, messageId)
      );

      queryClient.removeQueries({
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });

      return { previousMessage };
    },
    onError: (_, __, context) => {
      if (context?.previousMessage) {
        queryClient.setQueryData(
          threadKeys.messages.detail(householdId, threadId, messageId),
          context.previousMessage
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.list(householdId, threadId),
      });
    },
  });

  return {
    ...query,
    updateMessage,
    deleteMessage,
  };
};

// Read status hook with optimistic updates
export const useMessageReadStatus = (
  { householdId, threadId, messageId, enabled = true }: MessageOptions,
  options?: Omit<UseQueryOptions<MessageReadStatus>, "queryKey" | "queryFn">
) => {
  const queryClient = useQueryClient();
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  const query = useQuery({
    queryKey: threadKeys.messages.readStatus(householdId, threadId, messageId),
    queryFn: async () => {
      try {
        const result = await threadApi.readStatus.get(
          householdId,
          threadId,
          messageId
        );
        logger.debug("Message read status fetched", {
          messageId,
          threadId,
          householdId,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch read status", {
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
    ...options,
  });

  const markAsRead = useMutation<
    MessageReadStatus,
    Error,
    void,
    { previousStatus: MessageReadStatus | undefined }
  >({
    mutationFn: async () => {
      try {
        const result = await threadApi.readStatus.mark(
          householdId,
          threadId,
          messageId
        );
        logger.info("Message marked as read", {
          messageId,
          threadId,
          householdId,
        });
        return result;
      } catch (error) {
        logger.error("Failed to mark message as read", {
          messageId,
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.messages.readStatus(
          householdId,
          threadId,
          messageId
        ),
      });

      const previousStatus = queryClient.getQueryData<MessageReadStatus>(
        threadKeys.messages.readStatus(householdId, threadId, messageId)
      );

      if (currentUser) {
        const now = new Date();
        const optimisticStatus: MessageReadStatus = {
          messageId,
          readBy: [
            {
              userId: currentUser.id,
              readAt: now,
            },
          ],
          unreadBy: [],
        };

        queryClient.setQueryData<MessageReadStatus>(
          threadKeys.messages.readStatus(householdId, threadId, messageId),
          optimisticStatus
        );
      }

      return { previousStatus };
    },
    onError: (_, __, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(
          threadKeys.messages.readStatus(householdId, threadId, messageId),
          context.previousStatus
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.readStatus(
          householdId,
          threadId,
          messageId
        ),
      });
    },
  });

  return {
    ...query,
    markAsRead,
  };
};

// Reactions hook with optimistic updates
export const useMessageReactions = (
  { householdId, threadId, messageId, enabled = true }: MessageOptions,
  options?: Omit<
    UseQueryOptions<readonly ReactionWithUser[]>,
    "queryKey" | "queryFn"
  >
) => {
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  useEffect(() => {
    if (!isConnected || !enabled) return;

    const handleReactionUpdate = (event: ReactionUpdateEvent) => {
      queryClient.setQueryData<readonly ReactionWithUser[]>(
        threadKeys.messages.reactions(householdId, threadId, messageId),
        (old) => {
          if (!old) return old;
          if (event.action === MessageAction.REACTION_ADDED && event.reaction) {
            return [...old, event.reaction];
          }
          if (
            event.action === MessageAction.REACTION_REMOVED &&
            event.reactionId
          ) {
            return old.filter((r) => r.id !== event.reactionId);
          }
          return old;
        }
      );
      logger.debug("Reactions updated via socket", {
        messageId,
        threadId,
        householdId,
        action: event.action,
      });
    };

    socketClient.on(
      `message:${messageId}:reactions:update`,
      handleReactionUpdate
    );
    logger.debug("Subscribed to reaction updates", {
      messageId,
      threadId,
      householdId,
    });

    return () => {
      socketClient.off(
        `message:${messageId}:reactions:update`,
        handleReactionUpdate
      );
      logger.debug("Unsubscribed from reaction updates", {
        messageId,
        threadId,
        householdId,
      });
    };
  }, [isConnected, messageId, enabled, queryClient, householdId, threadId]);

  const query = useQuery({
    queryKey: threadKeys.messages.reactions(householdId, threadId, messageId),
    queryFn: async () => {
      try {
        const result = await threadApi.messages.reactions.getMessageReactions(
          householdId,
          threadId,
          messageId
        );
        logger.debug("Message reactions fetched", {
          messageId,
          threadId,
          householdId,
        });
        return result.data;
      } catch (error) {
        logger.error("Failed to fetch reactions", {
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
    ...options,
  });

  const addReaction = useMutation<
    ReactionWithUser,
    Error,
    CreateReactionDTO,
    { previousReactions: readonly ReactionWithUser[] | undefined }
  >({
    mutationFn: async (data) => {
      try {
        const result = await threadApi.messages.reactions.addReaction(
          householdId,
          threadId,
          messageId,
          data
        );
        logger.info("Reaction added", {
          messageId,
          threadId,
          householdId,
          type: data.type,
        });
        return result.data;
      } catch (error) {
        logger.error("Failed to add reaction", {
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
        queryKey: threadKeys.messages.reactions(
          householdId,
          threadId,
          messageId
        ),
      });

      const previousReactions = queryClient.getQueryData<
        readonly ReactionWithUser[]
      >(threadKeys.messages.reactions(householdId, threadId, messageId));

      if (currentUser) {
        const now = new Date();
        const optimisticReaction: ReactionWithUser = {
          id: `temp-${now.getTime()}`,
          messageId,
          userId: currentUser.id,
          emoji: data.emoji,
          type: data.type,
          createdAt: now,
          user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            profileImageURL: null,
            activeHouseholdId: householdId,
            createdAt: now,
            updatedAt: now,
          },
        };

        queryClient.setQueryData<readonly ReactionWithUser[]>(
          threadKeys.messages.reactions(householdId, threadId, messageId),
          (old) => (old ? [...old, optimisticReaction] : [optimisticReaction])
        );
      }

      return { previousReactions };
    },
    onError: (_, __, context) => {
      if (context?.previousReactions) {
        queryClient.setQueryData(
          threadKeys.messages.reactions(householdId, threadId, messageId),
          context.previousReactions
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.reactions(
          householdId,
          threadId,
          messageId
        ),
      });
    },
  });

  const removeReaction = useMutation<
    void,
    Error,
    string,
    { previousReactions: readonly ReactionWithUser[] | undefined }
  >({
    mutationFn: async (reactionId) => {
      try {
        await threadApi.messages.reactions.removeReaction(
          householdId,
          threadId,
          messageId,
          reactionId
        );
        logger.info("Reaction removed", {
          messageId,
          threadId,
          householdId,
          reactionId,
        });
      } catch (error) {
        logger.error("Failed to remove reaction", {
          messageId,
          threadId,
          householdId,
          reactionId,
          error,
        });
        throw error;
      }
    },
    onMutate: async (reactionId) => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.messages.reactions(
          householdId,
          threadId,
          messageId
        ),
      });

      const previousReactions = queryClient.getQueryData<
        readonly ReactionWithUser[]
      >(threadKeys.messages.reactions(householdId, threadId, messageId));

      queryClient.setQueryData<readonly ReactionWithUser[]>(
        threadKeys.messages.reactions(householdId, threadId, messageId),
        (old) => (old ? old.filter((r) => r.id !== reactionId) : [])
      );

      return { previousReactions };
    },
    onError: (_, __, context) => {
      if (context?.previousReactions) {
        queryClient.setQueryData(
          threadKeys.messages.reactions(householdId, threadId, messageId),
          context.previousReactions
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.reactions(
          householdId,
          threadId,
          messageId
        ),
      });
    },
  });

  return {
    ...query,
    addReaction,
    removeReaction,
  };
};

// Utility functions for reactions
export const reactionUtils = {
  hasReacted: (
    reactions: readonly ReactionWithUser[] | undefined,
    userId: string,
    type?: ReactionType
  ): boolean => {
    if (!reactions) return false;
    return reactions.some(
      (r) => r.userId === userId && (!type || r.type === type)
    );
  },

  getUserReaction: (
    reactions: readonly ReactionWithUser[] | undefined,
    userId: string,
    type?: ReactionType
  ): ReactionWithUser | undefined => {
    if (!reactions) return undefined;
    return reactions.find(
      (r) => r.userId === userId && (!type || r.type === type)
    );
  },

  getReactionCount: (
    reactions: readonly ReactionWithUser[] | undefined,
    type?: ReactionType
  ): number => {
    if (!reactions) return 0;
    return type
      ? reactions.filter((r) => r.type === type).length
      : reactions.length;
  },

  getReactionsByType: (
    reactions: readonly ReactionWithUser[] | undefined
  ): Record<ReactionType, number> => {
    if (!reactions) {
      return Object.values(ReactionType).reduce(
        (acc, type) => ({ ...acc, [type]: 0 }),
        {} as Record<ReactionType, number>
      );
    }

    const counts = reactions.reduce((acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    }, {} as Record<ReactionType, number>);

    // Ensure all reaction types are present in the result
    return Object.values(ReactionType).reduce(
      (acc, type) => ({
        ...acc,
        [type]: counts[type] || 0,
      }),
      {} as Record<ReactionType, number>
    );
  },

  getReactionUsers: (
    reactions: readonly ReactionWithUser[] | undefined,
    type?: ReactionType
  ): readonly User[] => {
    if (!reactions) return [];
    const filtered = type
      ? reactions.filter((r) => r.type === type)
      : reactions;
    return filtered.map((r) => r.user);
  },
};
