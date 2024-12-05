import { useCallback, useEffect, useRef, useState } from "react";
import { ThreadService } from "@/lib/api/services/threadService";
import { ThreadWithDetails } from "@shared/types";
import { PaginationOptions } from "@shared/interfaces";
import { ApiResponse } from "@shared/interfaces";
import { logger } from "@/lib/api/logger";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholds } from "@/contexts/HouseholdsContext";
import { requestManager } from "@/lib/api/requestManager";

interface UseThreadsOptions {
  initialPageSize?: number;
  autoRefreshInterval?: number;
  filters?: {
    householdIds?: string[];
  };
  enabled?: boolean;
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
  autoRefreshInterval = 30000,
  filters,
  enabled = true,
}: UseThreadsOptions = {}) {
  const { user } = useAuth();
  const { selectedHouseholds } = useHouseholds();
  const isMounted = useRef(true);
  const isInitializedRef = useRef(false);
  const threadService = useRef(new ThreadService()).current;

  const [state, setState] = useState<ThreadsState>({
    threads: [],
    isLoading: false,
    error: null,
    hasMore: true,
    nextCursor: undefined,
  });

  // Set mounted on mount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchThreads = useCallback(
    async (options?: { cursor?: string }) => {
      if (!enabled || !user || !isMounted.current) {
        logger.debug("Threads fetch skipped", {
          enabled,
          hasUser: !!user,
          isMounted: isMounted.current,
        });
        return;
      }

      const householdsToFetch =
        selectedHouseholds?.filter(
          (h) =>
            h.id &&
            typeof h.id === "string" &&
            h.members?.some(
              (m) => m.userId === user.id && m.isAccepted && m.isSelected
            )
        ) || [];

      if (!householdsToFetch.length) {
        logger.debug("No accessible households to fetch threads for", {
          selectedHouseholdIds: selectedHouseholds?.map((h) => h.id),
          userId: user.id,
          selectedHouseholds,
        });
        setState((prev) => ({
          ...prev,
          threads: [],
          isLoading: false,
          error: null,
          hasMore: false,
          nextCursor: undefined,
        }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        logger.debug("Fetching threads for selected households", {
          options,
          householdIds: householdsToFetch.map((h) => h.id),
          filters,
          enabled,
          householdsToFetch,
        });

        // Use requestManager to handle all household requests
        const responses = await Promise.all(
          householdsToFetch.map((household) =>
            requestManager
              .dedupRequest(
                `threads-${household.id}-${options?.cursor || "initial"}`,
                () =>
                  threadService.threads.getThreads(household.id, {
                    limit: initialPageSize,
                    cursor: options?.cursor,
                    sortBy: "updatedAt",
                    direction: "desc",
                  }),
                {
                  timeout: 10000,
                  retry: {
                    retries: 2,
                    backoff: true,
                  },
                  requiresAuth: true,
                }
              )
              .catch((error) => {
                if (error.name === "AbortError") {
                  throw error;
                }
                logger.error("Failed to fetch threads for household", {
                  error,
                  householdId: household.id,
                });
                return {
                  data: [],
                  pagination: { hasMore: false, nextCursor: undefined },
                };
              })
          )
        );

        if (!isMounted.current) return;

        // Process and combine threads from all responses
        const allThreads = responses.flatMap((response) => {
          logger.debug("Processing response", {
            data: response.data,
            pagination: response.pagination,
          });
          return response.data || [];
        });

        // Sort threads by updatedAt
        const sortedThreads = allThreads.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        // Apply pagination if needed
        const paginatedThreads = options?.cursor
          ? sortedThreads
          : sortedThreads.slice(0, initialPageSize);

        logger.debug("Processed threads", {
          totalThreads: allThreads.length,
          paginatedCount: paginatedThreads.length,
          cursor: options?.cursor,
        });

        setState((prev) => {
          const newThreads = options?.cursor
            ? [...prev.threads, ...paginatedThreads]
            : paginatedThreads;

          logger.debug("Updating threads state", {
            previousCount: prev.threads.length,
            newCount: newThreads.length,
            hasMore: responses.some((r) => r.pagination?.hasMore),
          });

          return {
            ...prev,
            threads: newThreads,
            isLoading: false,
            error: null,
            hasMore: responses.some((r) => r.pagination?.hasMore),
            nextCursor: responses.find((r) => r.pagination?.hasMore)?.pagination
              ?.nextCursor,
          };
        });

        return responses;
      } catch (error) {
        if (!isMounted.current) return;

        logger.error("Failed to fetch threads", { error, enabled });
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    },
    [enabled, user, selectedHouseholds, initialPageSize, threadService]
  );

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (!enabled || !user || !selectedHouseholds?.length) {
      logger.debug("Skipping threads fetch and schedule", {
        enabled,
        hasUser: !!user,
        householdsCount: selectedHouseholds?.length,
        selectedHouseholds,
      });
      return;
    }

    let intervalId: NodeJS.Timeout;

    const initialize = async () => {
      if (isInitializedRef.current) {
        logger.debug("Threads already initialized", {
          enabled,
          hasUser: !!user,
          householdsCount: selectedHouseholds?.length,
        });
        return;
      }

      try {
        logger.debug("Starting initial threads fetch", {
          enabled,
          hasUser: !!user,
          householdsCount: selectedHouseholds?.length,
          selectedHouseholds,
        });

        await fetchThreads();
        isInitializedRef.current = true;

        if (isMounted.current && autoRefreshInterval > 0) {
          intervalId = setInterval(() => {
            if (isMounted.current) {
              fetchThreads().catch((error) => {
                logger.error("Auto-refresh failed", { error });
              });
            }
          }, autoRefreshInterval);
        }
      } catch (error) {
        logger.error("Failed to fetch initial threads", { error });
      }
    };

    initialize();

    return () => {
      if (intervalId) clearInterval(intervalId);
      requestManager.abortAll();
    };
  }, [
    enabled,
    user?.id,
    selectedHouseholds,
    fetchThreads,
    autoRefreshInterval,
  ]);

  return {
    ...state,
    loadMore: useCallback(() => {
      if (state.isLoading || !state.hasMore) return;
      return fetchThreads({ cursor: state.nextCursor });
    }, [state.isLoading, state.hasMore, state.nextCursor, fetchThreads]),
  };
}
