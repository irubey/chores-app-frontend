// frontend/src/hooks/threads/useThread.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { ThreadService } from "@/lib/api/services/threadService";
import {
  ThreadWithDetails,
  CreateMessageDTO,
  MessageWithDetails,
  CreatePollDTO,
  CreateMentionDTO,
  CreateReactionDTO,
} from "@shared/types";
import { ReactionType } from "@shared/enums";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/api/logger";

interface UseThreadOptions {
  threadId: string;
  householdId: string;
  initialThread?: ThreadWithDetails;
  autoRefreshInterval?: number;
}

interface ThreadState {
  thread: ThreadWithDetails | null;
  isLoading: boolean;
  error: Error | null;
  messagesPagination: {
    hasMore: boolean;
    nextCursor?: string;
  };
}

export function useThread({
  threadId,
  householdId,
  initialThread,
  autoRefreshInterval = 5000, // 5 seconds for more real-time updates
}: UseThreadOptions) {
  const [state, setState] = useState<ThreadState>({
    thread: initialThread || null,
    isLoading: !initialThread,
    error: null,
    messagesPagination: {
      hasMore: true,
      nextCursor: undefined,
    },
  });

  const { user } = useAuth();
  const threadService = useRef(new ThreadService()).current;
  const abortControllerRef = useRef<AbortController>();

  // Track if component is mounted
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch thread details
  const fetchThread = useCallback(async () => {
    if (!user) return;

    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      logger.debug("Fetching thread details", { threadId, householdId });

      const response = await threadService.threads.getThreadDetails(
        householdId,
        threadId,
        abortControllerRef.current.signal
      );

      if (!isMounted.current) return;

      setState((prev) => ({
        ...prev,
        thread: response.data,
        isLoading: false,
        error: null,
      }));

      logger.info("Thread details fetched successfully", { threadId });
    } catch (error) {
      if (!isMounted.current) return;

      logger.error("Error fetching thread details", { error, threadId });
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [threadId, householdId, user, threadService]);

  // Send a new message
  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      if (!user || !state.thread) return;

      try {
        logger.debug("Sending message", {
          threadId,
          content,
          attachmentCount: attachments?.length,
        });

        const messageData: CreateMessageDTO = {
          content,
          threadId,
        };

        const response = await threadService.messages.createMessage(
          householdId,
          threadId,
          messageData
        );

        // If there are attachments, upload them
        if (attachments?.length) {
          await Promise.all(
            attachments.map((file) =>
              threadService.messages.attachments.addAttachment(
                householdId,
                threadId,
                response.data.id,
                file
              )
            )
          );
        }

        // Refresh thread to get latest state
        await fetchThread();

        logger.info("Message sent successfully", {
          threadId,
          messageId: response.data.id,
        });
      } catch (error) {
        logger.error("Error sending message", { error, threadId });
        throw error;
      }
    },
    [threadId, householdId, state.thread, user, threadService, fetchThread]
  );

  // Add reaction to message
  const addReaction = useCallback(
    async (messageId: string, type: ReactionType, emoji: string) => {
      if (!user || !state.thread) return;

      try {
        logger.debug("Adding reaction", { threadId, messageId, type, emoji });

        const reactionData: CreateReactionDTO = {
          type,
          emoji,
        };

        await threadService.messages.reactions.addReaction(
          householdId,
          threadId,
          messageId,
          reactionData
        );

        await fetchThread();

        logger.info("Reaction added successfully", {
          threadId,
          messageId,
          type,
          emoji,
        });
      } catch (error) {
        logger.error("Error adding reaction", { error, threadId, messageId });
        throw error;
      }
    },
    [threadId, householdId, state.thread, user, threadService, fetchThread]
  );

  // Create a poll
  const createPoll = useCallback(
    async (messageId: string, pollData: CreatePollDTO) => {
      if (!user || !state.thread) return;

      try {
        logger.debug("Creating poll", { threadId, messageId, pollData });

        await threadService.messages.polls.createPoll(
          householdId,
          threadId,
          messageId,
          pollData
        );

        await fetchThread();

        logger.info("Poll created successfully", { threadId, messageId });
      } catch (error) {
        logger.error("Error creating poll", { error, threadId, messageId });
        throw error;
      }
    },
    [threadId, householdId, state.thread, user, threadService, fetchThread]
  );

  // Mark message as read
  const markMessageAsRead = useCallback(
    async (messageId: string) => {
      if (!user || !state.thread) return;

      try {
        logger.debug("Marking message as read", { threadId, messageId });

        await threadService.messages.markAsRead(
          householdId,
          threadId,
          messageId
        );

        logger.info("Message marked as read", { threadId, messageId });
      } catch (error) {
        logger.error("Error marking message as read", {
          error,
          threadId,
          messageId,
        });
        throw error;
      }
    },
    [threadId, householdId, state.thread, user, threadService]
  );

  // Add mention
  const addMention = useCallback(
    async (messageId: string, mentionData: CreateMentionDTO) => {
      if (!user || !state.thread) return;

      try {
        logger.debug("Adding mention", { threadId, messageId, mentionData });

        await threadService.messages.mentions.createMention(
          householdId,
          threadId,
          messageId,
          mentionData
        );

        await fetchThread();

        logger.info("Mention added successfully", { threadId, messageId });
      } catch (error) {
        logger.error("Error adding mention", { error, threadId, messageId });
        throw error;
      }
    },
    [threadId, householdId, state.thread, user, threadService, fetchThread]
  );

  // Auto refresh
  useEffect(() => {
    if (!autoRefreshInterval || !user) return;

    const intervalId = setInterval(() => {
      fetchThread();
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, fetchThread, user]);

  // Initial fetch
  useEffect(() => {
    if (user && !initialThread) {
      fetchThread();
    }
  }, [fetchThread, user, initialThread]);

  return {
    ...state,
    sendMessage,
    addReaction,
    createPoll,
    markMessageAsRead,
    addMention,
    refresh: fetchThread,
  };
}
