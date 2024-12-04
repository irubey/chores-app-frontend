import { useCallback, useEffect, useRef, useState } from "react";
import { ThreadService } from "@/lib/api/services/threadService";
import { ThreadWithDetails } from "@shared/types";
import { PaginationOptions } from "@shared/interfaces";
import { ApiResponse } from "@shared/interfaces";
import { logger } from "@/lib/api/logger";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholds } from "@/contexts/HouseholdsContext";

interface UseThreadsOptions {
  initialPageSize?: number;
  autoRefreshInterval?: number;
}

interface ThreadsState {
  threads: ThreadWithDetails[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor?: string;
}

export function useThreads({
  initialPageSize = 20,
  autoRefreshInterval = 30000, // 30 seconds
}: UseThreadsOptions = {}) {
  const [state, setState] = useState<ThreadsState>({
    threads: [],
    isLoading: true,
    error: null,
    hasMore: true,
    nextCursor: undefined,
  });

  const { user } = useAuth();
  const { selectedHouseholds, getSelectedHouseholds } = useHouseholds();
  const threadService = useRef(new ThreadService()).current;
  const abortControllerRef = useRef<AbortController>();

  // Track if component is mounted
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch threads with pagination
  const fetchThreads = useCallback(
    async (options?: PaginationOptions) => {
      if (!user || !selectedHouseholds.length) return;

      try {
        // Cancel previous request if exists
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        logger.debug("Fetching threads for selected households", {
          options,
          selectedHouseholdIds: selectedHouseholds.map((h) => h.id),
        });

        // Fetch threads for each selected household
        const threadsPromises = selectedHouseholds.map((household) =>
          threadService.threads.getThreads(
            household.id,
            {
              limit: initialPageSize,
              cursor: options?.cursor,
              sortBy: "updatedAt",
              direction: "desc",
            },
            abortControllerRef.current.signal
          )
        );

        const responses = await Promise.all(threadsPromises);

        if (!isMounted.current) return;

        // Combine and sort threads from all households
        const allThreads = responses
          .flatMap((response) => response.data)
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, initialPageSize);

        setState((prev) => ({
          threads: options?.cursor
            ? [...prev.threads, ...allThreads]
            : allThreads,
          isLoading: false,
          error: null,
          hasMore: responses.some(
            (response) => response.pagination?.hasMore ?? false
          ),
          nextCursor: responses[0]?.pagination?.nextCursor, // Using first household's cursor for simplicity
        }));

        logger.info("Threads fetched successfully", {
          threadCount: allThreads.length,
          householdCount: selectedHouseholds.length,
        });
      } catch (error) {
        if (!isMounted.current) return;

        logger.error("Error fetching threads", { error });
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    },
    [initialPageSize, threadService, selectedHouseholds, user]
  );

  // Load more threads
  const loadMore = useCallback(() => {
    if (state.isLoading || !state.hasMore) return;
    return fetchThreads({ cursor: state.nextCursor });
  }, [fetchThreads, state.isLoading, state.hasMore, state.nextCursor]);

  // Auto refresh threads
  useEffect(() => {
    if (!autoRefreshInterval || !user) return;

    const intervalId = setInterval(() => {
      fetchThreads();
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, fetchThreads, user]);

  // Initial fetch and setup
  useEffect(() => {
    if (user) {
      getSelectedHouseholds().then(() => {
        fetchThreads();
      });
    }
  }, [fetchThreads, user, getSelectedHouseholds]);

  // Get unread count for a thread
  const getThreadUnreadCount = useCallback(
    (thread: ThreadWithDetails) => {
      if (!user) return 0;

      return thread.messages.reduce((count, message) => {
        const isRead = message.reads?.some((read) => read.user.id === user.id);
        return count + (isRead ? 0 : 1);
      }, 0);
    },
    [user]
  );

  // Update thread in cache
  const updateThread = useCallback((updatedThread: ThreadWithDetails) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === updatedThread.id ? updatedThread : thread
      ),
    }));
  }, []);

  return {
    ...state,
    loadMore,
    refresh: () => fetchThreads(),
    getThreadUnreadCount,
    updateThread,
  };
}
