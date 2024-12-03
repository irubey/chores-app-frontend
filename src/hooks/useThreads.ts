"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api/apiClient";
import {
  ThreadWithDetails,
  ThreadWithParticipants,
  CreateThreadDTO,
  UpdateThreadDTO,
  ThreadWithMessages,
} from "@shared/types";
import { PaginationOptions } from "@shared/interfaces";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";

interface UseThreadState {
  threads: ThreadWithDetails[];
  selectedThread: ThreadWithDetails | null;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor?: string;
}

interface UseThreadOptions {
  initialThreads?: ThreadWithDetails[];
  pageSize?: number;
}

export function useThread(householdId: string, options: UseThreadOptions = {}) {
  const [state, setState] = useState<UseThreadState>({
    threads: options.initialThreads || [],
    selectedThread: null,
    isLoading: false,
    error: null,
    hasMore: true,
    nextCursor: undefined,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch threads with pagination
  const fetchThreads = useCallback(
    async (paginationOptions?: PaginationOptions) => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        logger.debug("Fetching threads", { householdId, paginationOptions });

        const response = await apiClient.threads.threads.getThreads(
          householdId,
          {
            limit: options.pageSize || 20,
            ...paginationOptions,
          },
          abortControllerRef.current.signal
        );

        setState((prev) => ({
          ...prev,
          threads: paginationOptions?.cursor
            ? [...prev.threads, ...response.data]
            : response.data,
          hasMore: response.pagination?.hasMore ?? false,
          nextCursor: response.pagination?.nextCursor,
          isLoading: false,
        }));

        logger.info("Successfully fetched threads", {
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
        logger.error("Failed to fetch threads", { error });
      }
    },
    [householdId, options.pageSize]
  );

  // Create a new thread
  const createThread = useCallback(
    async (threadData: CreateThreadDTO) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        logger.debug("Creating thread", { householdId, threadData });

        const response = await apiClient.threads.threads.createThread(
          householdId,
          threadData
        );

        setState((prev) => ({
          ...prev,
          threads: [response.data, ...prev.threads],
          isLoading: false,
        }));

        logger.info("Successfully created thread", {
          threadId: response.data.id,
        });

        return response.data;
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : "Failed to create thread";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        logger.error("Failed to create thread", { error });
        throw error;
      }
    },
    [householdId]
  );

  // Get thread details
  const getThreadDetails = useCallback(
    async (threadId: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        logger.debug("Getting thread details", { householdId, threadId });

        const response = await apiClient.threads.threads.getThreadDetails(
          householdId,
          threadId
        );

        setState((prev) => ({
          ...prev,
          selectedThread: response.data,
          isLoading: false,
        }));

        logger.info("Successfully got thread details", { threadId });
        return response.data;
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : "Failed to get thread details";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        logger.error("Failed to get thread details", { error });
        throw error;
      }
    },
    [householdId]
  );

  // Update a thread
  const updateThread = useCallback(
    async (threadId: string, threadData: UpdateThreadDTO) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        logger.debug("Updating thread", { householdId, threadId, threadData });

        const response = await apiClient.threads.threads.updateThread(
          householdId,
          threadId,
          threadData
        );

        setState((prev) => ({
          ...prev,
          threads: prev.threads.map((thread) =>
            thread.id === threadId ? response.data : thread
          ),
          selectedThread:
            prev.selectedThread?.id === threadId
              ? response.data
              : prev.selectedThread,
          isLoading: false,
        }));

        logger.info("Successfully updated thread", { threadId });
        return response.data;
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : "Failed to update thread";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        logger.error("Failed to update thread", { error });
        throw error;
      }
    },
    [householdId]
  );

  // Delete a thread
  const deleteThread = useCallback(
    async (threadId: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        logger.debug("Deleting thread", { householdId, threadId });

        await apiClient.threads.threads.deleteThread(householdId, threadId);

        setState((prev) => ({
          ...prev,
          threads: prev.threads.filter((thread) => thread.id !== threadId),
          selectedThread:
            prev.selectedThread?.id === threadId ? null : prev.selectedThread,
          isLoading: false,
        }));

        logger.info("Successfully deleted thread", { threadId });
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : "Failed to delete thread";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        logger.error("Failed to delete thread", { error });
        throw error;
      }
    },
    [householdId]
  );

  // Invite users to thread
  const inviteUsers = useCallback(
    async (threadId: string, userIds: string[]) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        logger.debug("Inviting users to thread", {
          householdId,
          threadId,
          userIds,
        });

        const response = await apiClient.threads.threads.inviteUsers(
          householdId,
          threadId,
          userIds
        );

        setState((prev) => ({
          ...prev,
          threads: prev.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  participants: response.data.participants,
                }
              : thread
          ),
          selectedThread:
            prev.selectedThread?.id === threadId
              ? {
                  ...prev.selectedThread,
                  participants: response.data.participants,
                }
              : prev.selectedThread,
          isLoading: false,
        }));

        logger.info("Successfully invited users to thread", {
          threadId,
          userCount: userIds.length,
        });
        return response.data;
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : "Failed to invite users to thread";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        logger.error("Failed to invite users to thread", { error });
        throw error;
      }
    },
    [householdId]
  );

  // Load more threads
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading) {
      fetchThreads({ cursor: state.nextCursor });
    }
  }, [state.hasMore, state.isLoading, state.nextCursor, fetchThreads]);

  // Initial fetch
  useEffect(() => {
    fetchThreads();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchThreads]);

  return {
    threads: state.threads,
    selectedThread: state.selectedThread,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    createThread,
    getThreadDetails,
    updateThread,
    deleteThread,
    inviteUsers,
    loadMore,
    refresh: () => fetchThreads(),
  };
}
