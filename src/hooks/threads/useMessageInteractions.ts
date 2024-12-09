// frontend/src/hooks/threads/useMessageInteractions.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import {
  MessageWithDetails,
  CreateMessageDTO,
  UpdateMessageDTO,
  MessageReadStatus,
  MessageReadWithUser,
  ReactionWithUser,
  CreateReactionDTO,
  MentionWithUser,
  CreateMentionDTO,
} from "@shared/types";
import { ReactionType } from "@shared/enums";
import { logger } from "@/lib/api/logger";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { ApiResponse } from "@shared/interfaces/apiResponse";

// Types
interface MessageOptions {
  householdId: string;
  threadId: string;
  messageId: string;
  enabled?: boolean;
}

// Query hook for message details
export const useMessage = (
  { householdId, threadId, messageId, enabled = true }: MessageOptions,
  options?: Omit<UseQueryOptions<MessageWithDetails>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
    queryFn: async () => {
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
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: enabled && !!messageId && !!threadId && !!householdId,
    ...options,
  });
};

// Query hook for message read status
export const useMessageReadStatus = (
  { householdId, threadId, messageId, enabled = true }: MessageOptions,
  options?: Omit<UseQueryOptions<MessageReadStatus>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: threadKeys.messages.readStatus(householdId, threadId, messageId),
    queryFn: async () => {
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
    },
    staleTime: STALE_TIMES.SHORT,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: enabled && !!messageId && !!threadId && !!householdId,
    ...options,
  });
};

// Query hook for message reactions
export const useMessageReactions = (
  { householdId, threadId, messageId, enabled = true }: MessageOptions,
  options?: Omit<UseQueryOptions<ReactionWithUser[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: threadKeys.messages.reactions(householdId, threadId, messageId),
    queryFn: async () => {
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
    },
    staleTime: STALE_TIMES.SHORT,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: enabled && !!messageId && !!threadId && !!householdId,
    ...options,
  });
};

// Query hook for message mentions
export const useMessageMentions = (
  { householdId, threadId, messageId, enabled = true }: MessageOptions,
  options?: Omit<UseQueryOptions<MentionWithUser[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: threadKeys.messages.mentions(householdId, threadId, messageId),
    queryFn: async () => {
      const result = await threadApi.messages.mentions.getMessageMentions(
        householdId,
        threadId,
        messageId
      );
      logger.debug("Message mentions fetched", {
        messageId,
        threadId,
        householdId,
      });
      return result.data;
    },
    staleTime: STALE_TIMES.SHORT,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: enabled && !!messageId && !!threadId && !!householdId,
    ...options,
  });
};

// Mutation hook for message operations
export const useMessageOperations = ({
  householdId,
  threadId,
  messageId,
}: MessageOptions) => {
  const queryClient = useQueryClient();

  const updateMessage = useMutation({
    mutationFn: async (data: UpdateMessageDTO) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.list(householdId, threadId),
      });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async () => {
      await threadApi.messages.delete(householdId, threadId, messageId);
      logger.info("Message deleted", {
        messageId,
        threadId,
        householdId,
      });
    },
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.list(householdId, threadId),
      });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.readStatus(
          householdId,
          threadId,
          messageId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.list(householdId, threadId),
      });
    },
  });

  const addReaction = useMutation({
    mutationFn: async (data: CreateReactionDTO) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.reactions(
          householdId,
          threadId,
          messageId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });
    },
  });

  const removeReaction = useMutation({
    mutationFn: async (reactionId: string) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.reactions(
          householdId,
          threadId,
          messageId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });
    },
  });

  const addMention = useMutation({
    mutationFn: async (data: CreateMentionDTO) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.mentions(
          householdId,
          threadId,
          messageId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });
    },
  });

  const removeMention = useMutation({
    mutationFn: async (mentionId: string) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.mentions(
          householdId,
          threadId,
          messageId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.detail(householdId, threadId, messageId),
      });
    },
  });

  return {
    updateMessage,
    deleteMessage,
    markAsRead,
    addReaction,
    removeReaction,
    addMention,
    removeMention,
  };
};

// Utility functions
export const messageUtils = {
  isRead: (
    readStatus: MessageReadStatus | undefined,
    userId: string
  ): boolean => {
    if (!readStatus) return false;
    return readStatus.readBy.some((r) => r.userId === userId);
  },

  getReadCount: (readStatus: MessageReadStatus | undefined): number => {
    if (!readStatus) return 0;
    return readStatus.readBy.length;
  },

  getLastReadAt: (
    readStatus: MessageReadStatus | undefined,
    userId: string
  ): Date | undefined => {
    if (!readStatus) return undefined;
    const userRead = readStatus.readBy.find((r) => r.userId === userId);
    return userRead ? new Date(userRead.readAt) : undefined;
  },

  hasReaction: (
    reactions: ReactionWithUser[] | undefined,
    userId: string,
    type: ReactionType
  ): boolean => {
    if (!reactions) return false;
    return reactions.some((r) => r.user.id === userId && r.type === type);
  },

  getReactionCount: (
    reactions: ReactionWithUser[] | undefined,
    type: ReactionType
  ): number => {
    if (!reactions) return 0;
    return reactions.filter((r) => r.type === type).length;
  },

  getUserReaction: (
    reactions: ReactionWithUser[] | undefined,
    userId: string,
    type: ReactionType
  ): ReactionWithUser | undefined => {
    if (!reactions) return undefined;
    return reactions.find((r) => r.user.id === userId && r.type === type);
  },

  isMentioned: (
    mentions: MentionWithUser[] | undefined,
    userId: string
  ): boolean => {
    if (!mentions) return false;
    return mentions.some((m) => m.user.id === userId);
  },

  getMention: (
    mentions: MentionWithUser[] | undefined,
    userId: string
  ): MentionWithUser | undefined => {
    if (!mentions) return undefined;
    return mentions.find((m) => m.user.id === userId);
  },
};
