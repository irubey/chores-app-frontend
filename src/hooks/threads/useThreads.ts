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
  onError?: (error: Error) => void;
}

interface ThreadsState {
  threads: ThreadWithDetails[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor?: string;
  lastUpdated?: Date;
}

interface ThreadsResponse extends ApiResponse<ThreadWithDetails[]> {
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
  };
}

interface ThreadsServiceResponse {
  data: ThreadWithDetails[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
  };
}

export function useThreads({
  initialPageSize = 20,
  autoRefreshInterval = 30000,
  filters,
  enabled = true,
  onError,
}: UseThreadsOptions = {}) {
  const { user } = useAuth();
  const { selectedHouseholds } = useHouseholds();
  const isMounted = useRef(true);
  const isInitializedRef = useRef(false);
  const threadService = useRef(new ThreadService()).current;
  const lastFetchRef = useRef<Date>();

  const [state, setState] = useState<ThreadsState>({
    threads: [],
    isLoading: false,
    error: null,
    hasMore: true,
    nextCursor: undefined,
    lastUpdated: undefined,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      requestManager.abortAll();
    };
  }, []);

  const getValidHouseholds = useCallback(() => {
    if (!user) return [];

    return (
      selectedHouseholds?.filter(
        (h) =>
          h?.id &&
          typeof h.id === "string" &&
          h.id.trim() !== "" &&
          h.members?.some(
            (m) => m.userId === user.id && m.isAccepted && m.isSelected
          )
      ) || []
    );
  }, [selectedHouseholds, user]);

  const fetchThreads = useCallback(
    async (options?: { cursor?: string; force?: boolean }) => {
      if (!enabled || !user || !isMounted.current) {
        logger.debug("Threads fetch skipped", {
          enabled,
          hasUser: !!user,
          isMounted: isMounted.current,
        });
        return;
      }

      const householdsToFetch = getValidHouseholds();

      if (!householdsToFetch.length) {
        logger.debug("No accessible households to fetch threads for");
        setState((prev) => ({
          ...prev,
          threads: [],
          isLoading: false,
          error: null,
          hasMore: false,
          nextCursor: undefined,
          lastUpdated: new Date(),
        }));
        return;
      }

      // Throttle requests unless forced
      if (
        !options?.force &&
        lastFetchRef.current &&
        Date.now() - lastFetchRef.current.getTime() < 1000
      ) {
        logger.debug("Throttling thread fetch request");
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        lastFetchRef.current = new Date();

        logger.debug("Fetching threads", {
          options,
          householdCount: householdsToFetch.length,
          filters,
        });

        const responses = await Promise.all(
          householdsToFetch.map((household) => {
            const requestKey = `threads-${household.id}-${
              options?.cursor || "initial"
            }-${initialPageSize}-${filters?.householdIds?.join(",")}`;

            return requestManager
              .dedupRequest<ThreadsServiceResponse>(
                requestKey,
                async () => {
                  const response = await threadService.threads.getThreads(
                    household.id,
                    {
                      limit: initialPageSize,
                      cursor: options?.cursor,
                      sortBy: "updatedAt",
                      direction: "desc",
                    }
                  );

                  // Ensure pagination is always included
                  return {
                    data: response.data,
                    pagination: response.pagination || {
                      hasMore: false,
                      nextCursor: undefined,
                    },
                  };
                },
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
                logger.error("Failed to fetch threads for household", {
                  error,
                  householdId: household.id,
                });
                return {
                  data: [],
                  pagination: { hasMore: false, nextCursor: undefined },
                };
              });
          })
        );

        if (!isMounted.current) return;

        const allThreads = responses.flatMap((response) => response.data || []);
        const sortedThreads = allThreads.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        const paginatedThreads = options?.cursor
          ? sortedThreads
          : sortedThreads.slice(0, initialPageSize);

        setState((prev) => {
          const newThreads = options?.cursor
            ? [...prev.threads, ...paginatedThreads]
            : paginatedThreads;

          return {
            ...prev,
            threads: newThreads,
            isLoading: false,
            error: null,
            hasMore: responses.some((r) => r.pagination?.hasMore),
            nextCursor: responses.find((r) => r.pagination?.hasMore)?.pagination
              ?.nextCursor,
            lastUpdated: new Date(),
          };
        });

        return responses;
      } catch (error) {
        if (!isMounted.current) return;

        const err = error as Error;
        logger.error("Failed to fetch threads", { error: err, enabled });

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err,
          lastUpdated: new Date(),
        }));

        onError?.(err);
      }
    },
    [
      enabled,
      user,
      getValidHouseholds,
      initialPageSize,
      threadService,
      filters,
      onError,
    ]
  );

  useEffect(() => {
    if (!enabled || !user || !selectedHouseholds?.length) {
      logger.debug("Skipping threads fetch and schedule");
      return;
    }

    let intervalId: NodeJS.Timeout;
    let isRefreshing = false;

    const initialize = async () => {
      if (isInitializedRef.current) return;

      try {
        await fetchThreads();
        isInitializedRef.current = true;

        if (isMounted.current && autoRefreshInterval > 0) {
          intervalId = setInterval(async () => {
            if (isMounted.current && !isRefreshing) {
              isRefreshing = true;
              try {
                await fetchThreads({ force: true });
              } finally {
                isRefreshing = false;
              }
            }
          }, autoRefreshInterval);
        }
      } catch (error) {
        logger.error("Failed to initialize threads", { error });
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
    refresh: useCallback(
      (force = false) => {
        logger.debug("Manually refreshing threads", { force });
        return fetchThreads({ force });
      },
      [fetchThreads]
    ),
  };
}
