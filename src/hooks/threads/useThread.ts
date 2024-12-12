// frontend/src/hooks/threads/useThread.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import { logger } from "@/lib/api/logger";
import type {
  ThreadWithDetails,
  CreateThreadDTO,
  UpdateThreadDTO,
} from "@shared/types";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";

// Types
interface UseThreadOptions {
  householdId: string;
  threadId: string;
  enabled?: boolean;
}

// Single thread query hook
export const useThread = (
  { householdId, threadId, enabled = true }: UseThreadOptions,
  options?: Omit<UseQueryOptions<ThreadWithDetails>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: threadKeys.detail(householdId, threadId),
    queryFn: async () => {
      const result = await threadApi.threads.get(householdId, threadId);
      logger.debug("Thread data fetched", {
        threadId,
        householdId,
        messageCount: result.messages?.length,
      });
      return result;
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: enabled && !!threadId && !!householdId,
    ...options,
  });
};

// Create thread mutation
export const useCreateThread = (
  householdId: string,
  options?: Omit<
    UseMutationOptions<
      ThreadWithDetails,
      Error,
      Omit<CreateThreadDTO, "householdId">
    >,
    "mutationFn"
  >
): UseMutationResult<
  ThreadWithDetails,
  Error,
  Omit<CreateThreadDTO, "householdId">
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CreateThreadDTO, "householdId">) => {
      const result = await threadApi.threads.create(householdId, data);
      logger.info("Thread created", {
        threadId: result.id,
        householdId,
        title: result.title,
        participantsCount: result.participants?.length,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
    },
    ...options,
  });
};

// Update thread mutation
export const useUpdateThread = (
  householdId: string,
  options?: Omit<
    UseMutationOptions<
      ThreadWithDetails,
      Error,
      { id: string; data: UpdateThreadDTO }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await threadApi.threads.update(householdId, id, data);
      logger.info("Thread updated", {
        threadId: id,
        householdId,
        updatedFields: Object.keys(data),
        newTitle: data.title,
      });
      return result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.detail(householdId, id),
      });
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
    },
    ...options,
  });
};

// Delete thread mutation
export const useDeleteThread = (
  householdId: string,
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      await threadApi.threads.delete(householdId, threadId);
      logger.info("Thread deleted", {
        threadId,
        householdId,
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: (_, threadId) => {
      queryClient.removeQueries({
        queryKey: threadKeys.detail(householdId, threadId),
      });
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
    },
    ...options,
  });
};
