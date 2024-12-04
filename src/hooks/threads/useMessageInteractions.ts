// frontend/src/hooks/threads/useMessageInteractions.ts
import { useCallback, useState } from "react";
import { ThreadService } from "@/lib/api/services/threadService";
import {
  MessageWithDetails,
  CreateReactionDTO,
  CreateMentionDTO,
  ReactionWithUser,
  MentionWithUser,
  MessageReadWithUser,
} from "@shared/types";
import { ReactionType } from "@shared/enums";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/api/logger";

interface UseMessageInteractionsOptions {
  householdId: string;
  threadId: string;
  messageId: string;
  message?: MessageWithDetails;
  onUpdate?: () => Promise<void>;
}

interface MessageInteractionsState {
  reactions: ReactionWithUser[];
  mentions: MentionWithUser[];
  reads: MessageReadWithUser[];
  isLoading: {
    reactions: boolean;
    mentions: boolean;
    reads: boolean;
  };
  error: Error | null;
}

export function useMessageInteractions({
  householdId,
  threadId,
  messageId,
  message,
  onUpdate,
}: UseMessageInteractionsOptions) {
  const [state, setState] = useState<MessageInteractionsState>({
    reactions: message?.reactions || [],
    mentions: message?.mentions || [],
    reads: message?.reads || [],
    isLoading: {
      reactions: false,
      mentions: false,
      reads: false,
    },
    error: null,
  });

  const { user } = useAuth();
  const threadService = new ThreadService();

  // Toggle reaction (add/remove)
  const toggleReaction = useCallback(
    async (type: ReactionType, emoji: string) => {
      if (!user) return;

      try {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, reactions: true },
        }));

        logger.debug("Toggling reaction", { messageId, type, emoji });

        const existingReaction = state.reactions.find(
          (r) => r.type === type && r.user.id === user.id
        );

        if (existingReaction) {
          await threadService.messages.reactions.removeReaction(
            householdId,
            threadId,
            messageId,
            existingReaction.id
          );

          setState((prev) => ({
            ...prev,
            reactions: prev.reactions.filter(
              (r) => r.id !== existingReaction.id
            ),
          }));
        } else {
          const reactionData: CreateReactionDTO = { type, emoji };
          const response = await threadService.messages.reactions.addReaction(
            householdId,
            threadId,
            messageId,
            reactionData
          );

          setState((prev) => ({
            ...prev,
            reactions: [...prev.reactions, response.data],
          }));
        }

        onUpdate?.();
        logger.info("Reaction toggled successfully", { messageId, type });
      } catch (error) {
        logger.error("Error toggling reaction", { error, messageId });
        setState((prev) => ({ ...prev, error: error as Error }));
        throw error;
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, reactions: false },
        }));
      }
    },
    [householdId, threadId, messageId, user, state.reactions, onUpdate]
  );

  // Add mention
  const addMention = useCallback(
    async (userId: string) => {
      if (!user) return;

      try {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, mentions: true },
        }));

        logger.debug("Adding mention", { messageId, userId });

        const mentionData: CreateMentionDTO = { userId };
        const response = await threadService.messages.mentions.createMention(
          householdId,
          threadId,
          messageId,
          mentionData
        );

        setState((prev) => ({
          ...prev,
          mentions: [...prev.mentions, response.data],
        }));

        onUpdate?.();
        logger.info("Mention added successfully", { messageId, userId });
      } catch (error) {
        logger.error("Error adding mention", { error, messageId });
        setState((prev) => ({ ...prev, error: error as Error }));
        throw error;
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, mentions: false },
        }));
      }
    },
    [householdId, threadId, messageId, user, onUpdate]
  );

  // Mark as read
  const markAsRead = useCallback(async () => {
    if (!user) return;

    try {
      setState((prev) => ({
        ...prev,
        isLoading: { ...prev.isLoading, reads: true },
      }));

      logger.debug("Marking message as read", { messageId });

      const response = await threadService.messages.markAsRead(
        householdId,
        threadId,
        messageId
      );

      setState((prev) => ({
        ...prev,
        reads: [...prev.reads, response.data],
      }));

      onUpdate?.();
      logger.info("Message marked as read", { messageId });
    } catch (error) {
      logger.error("Error marking message as read", { error, messageId });
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    } finally {
      setState((prev) => ({
        ...prev,
        isLoading: { ...prev.isLoading, reads: false },
      }));
    }
  }, [householdId, threadId, messageId, user, onUpdate]);

  // Check if user has reacted with specific type
  const hasReacted = useCallback(
    (type: ReactionType) => {
      if (!user) return false;
      return state.reactions.some(
        (r) => r.type === type && r.user.id === user.id
      );
    },
    [state.reactions, user]
  );

  // Check if message is read by user
  const isRead = useCallback(() => {
    if (!user) return false;
    return state.reads.some((r) => r.user.id === user.id);
  }, [state.reads, user]);

  // Get reaction count by type
  const getReactionCount = useCallback(
    (type: ReactionType) => {
      return state.reactions.filter((r) => r.type === type).length;
    },
    [state.reactions]
  );

  // Update message
  const updateMessage = useCallback(
    async (content: string) => {
      if (!user) return;

      try {
        logger.debug("Updating message", { messageId, content });

        await threadService.messages.updateMessage(
          householdId,
          threadId,
          messageId,
          { content }
        );

        onUpdate?.();
        logger.info("Message updated successfully", { messageId });
      } catch (error) {
        logger.error("Error updating message", { error, messageId });
        throw error;
      }
    },
    [householdId, threadId, messageId, user, onUpdate]
  );

  // Delete message
  const deleteMessage = useCallback(async () => {
    if (!user) return;

    try {
      logger.debug("Deleting message", { messageId });

      await threadService.messages.deleteMessage(
        householdId,
        threadId,
        messageId
      );

      onUpdate?.();
      logger.info("Message deleted successfully", { messageId });
    } catch (error) {
      logger.error("Error deleting message", { error, messageId });
      throw error;
    }
  }, [householdId, threadId, messageId, user, onUpdate]);

  const optimisticToggleReaction = useCallback(
    (type: ReactionType, emoji: string) => {
      if (!user) return;

      // Optimistically update the UI
      setState((prev) => {
        const existingReaction = prev.reactions.find(
          (r) => r.type === type && r.user.id === user.id
        );

        if (existingReaction) {
          // Remove reaction optimistically
          return {
            ...prev,
            reactions: prev.reactions.filter(
              (r) => r.id !== existingReaction.id
            ),
          };
        } else {
          // Add reaction optimistically
          const optimisticReaction: ReactionWithUser = {
            id: `temp-${Date.now()}`,
            type,
            emoji,
            user,
            messageId,
            userId: user.id,
            createdAt: new Date(),
          };
          return {
            ...prev,
            reactions: [...prev.reactions, optimisticReaction],
          };
        }
      });

      // Perform actual API call
      toggleReaction(type, emoji).catch(() => {
        // Revert on error
        setState((prev) => ({
          ...prev,
          reactions: message?.reactions || [],
        }));
      });
    },
    [user, toggleReaction, message]
  );

  return {
    ...state,
    toggleReaction,
    addMention,
    markAsRead,
    updateMessage,
    deleteMessage,
    hasReacted,
    isRead,
    getReactionCount,
    optimisticToggleReaction,
  };
}
