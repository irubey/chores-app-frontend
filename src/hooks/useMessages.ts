"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api/apiClient";
import {
  MessageWithDetails,
  CreateMessageDTO,
  UpdateMessageDTO,
} from "@shared/types";
import { PaginationOptions } from "@shared/interfaces";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";

interface UseMessagesState {
  messages: MessageWithDetails[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor?: string;
}

interface UseMessagesOptions {
  initialMessages?: MessageWithDetails[];
  pageSize?: number;
}

export function useMessages(
  householdId: string,
  threadId: string,
  options: UseMessagesOptions = {}
) {
  const [state, setState] = useState<UseMessagesState>({
    messages: options.initialMessages || [],
    isLoading: false,
    error: null,
    hasMore: true,
    nextCursor: undefined,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch messages with pagination
  const fetchMessages = useCallback(
    async (paginationOptions?: PaginationOptions) => {
      try {
        // Cancel previous request if exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        logger.debug("Fetching messages", {
          householdId,
          threadId,
          paginationOptions,
        });

        const response = await apiClient.threads.messages.getMessages(
          householdId,
          threadId,
          {
            limit: options.pageSize || 20,
            ...paginationOptions,
          },
          abortControllerRef.current.signal
        );

        setState((prev) => ({
          ...prev,
          messages: paginationOptions?.cursor
            ? [...prev.messages, ...response.data]
            : response.data,
          hasMore: response.pagination?.hasMore ?? false,
          nextCursor: response.pagination?.nextCursor,
          isLoading: false,
        }));

        logger.info("Successfully fetched messages", {
          count: response.data.length,
          hasMore: response.pagination?.hasMore,
        });
      } catch (error) {
        if (error instanceof ApiError) {
          setState((prev) => ({
            ...prev,
            error: error.message,
            isLoading: false,
          }));
        }
        logger.error("Failed to fetch messages", { error });
      }
    },
    [householdId, threadId, options.pageSize]
  );

  // Send a new message
  const sendMessage = useCallback(
    async (messageData: CreateMessageDTO) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        logger.debug("Sending message", { householdId, threadId, messageData });

        const response = await apiClient.threads.messages.createMessage(
          householdId,
          threadId,
          messageData
        );

        setState((prev) => ({
          ...prev,
          messages: [response.data, ...prev.messages],
          isLoading: false,
        }));

        logger.info("Successfully sent message", {
          messageId: response.data.id,
        });

        return response.data;
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : "Failed to send message";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        logger.error("Failed to send message", { error });
        throw error;
      }
    },
    [householdId, threadId]
  );

  // Update an existing message
  const updateMessage = useCallback(
    async (messageId: string, messageData: UpdateMessageDTO) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        logger.debug("Updating message", {
          householdId,
          threadId,
          messageId,
          messageData,
        });

        const response = await apiClient.threads.messages.updateMessage(
          householdId,
          threadId,
          messageId,
          messageData
        );

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? response.data : msg
          ),
          isLoading: false,
        }));

        logger.info("Successfully updated message", { messageId });
        return response.data;
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : "Failed to update message";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        logger.error("Failed to update message", { error });
        throw error;
      }
    },
    [householdId, threadId]
  );

  // Delete a message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        logger.debug("Deleting message", {
          householdId,
          threadId,
          messageId,
        });

        await apiClient.threads.messages.deleteMessage(
          householdId,
          threadId,
          messageId
        );

        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== messageId),
          isLoading: false,
        }));

        logger.info("Successfully deleted message", { messageId });
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : "Failed to delete message";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        logger.error("Failed to delete message", { error });
        throw error;
      }
    },
    [householdId, threadId]
  );

  // Load more messages
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading) {
      fetchMessages({ cursor: state.nextCursor });
    }
  }, [state.hasMore, state.isLoading, state.nextCursor, fetchMessages]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMessages]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    sendMessage,
    updateMessage,
    deleteMessage,
    loadMore,
    refresh: () => fetchMessages(),
  };
}
