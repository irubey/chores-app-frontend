import { useQueries, type UseQueryOptions } from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import { logger } from "@/lib/api/logger";
import type { ThreadWithDetails } from "@shared/types";
import type { PaginationOptions } from "@shared/interfaces";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { ApiResponse } from "@shared/interfaces/apiResponse";

// Types
interface ThreadsQueryParams extends PaginationOptions {
  householdIds: string[];
  enabled?: boolean;
}

// List hook for multiple threads
export const useThreads = (
  params: ThreadsQueryParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<ThreadWithDetails[]>>,
    "queryKey" | "queryFn"
  >
) => {
  const queries = useQueries({
    queries: params.householdIds.map((householdId) => ({
      queryKey: threadKeys.list(householdId, params),
      queryFn: async () => {
        const result = await threadApi.threads.list(householdId, {
          params: {
            limit: params.limit,
            cursor: params.cursor,
            sortBy: params.sortBy,
            direction: params.direction,
          },
        });

        logger.debug("Threads data fetched", {
          householdId,
          count: result.data.length,
          hasPagination: !!result.pagination,
          params,
        });

        return result;
      },
      staleTime: STALE_TIMES.STANDARD,
      gcTime: CACHE_TIMES.STANDARD,
      enabled: params.enabled !== false && !!householdId,
      ...options,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error;
  const data = queries.reduce<ApiResponse<ThreadWithDetails[]>>(
    (acc, query) => {
      if (!query.data) return acc;
      return {
        data: [...acc.data, ...query.data.data],
        pagination: query.data.pagination,
      };
    },
    { data: [], pagination: { hasMore: false } }
  );

  // Sort combined threads by updatedAt
  const sortedData = {
    ...data,
    data: [...data.data].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
  };

  return {
    data: sortedData,
    isLoading,
    error,
  };
};
