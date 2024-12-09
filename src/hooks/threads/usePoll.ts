// frontend/src/hooks/threads/usePoll.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import type {
  PollWithDetails,
  CreatePollDTO,
  UpdatePollDTO,
  CreatePollVoteDTO,
  PollVoteWithUser,
} from "@shared/types";
import { PollStatus } from "@shared/enums";
import { logger } from "@/lib/api/logger";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";

// Types
interface PollOptions {
  householdId: string;
  threadId: string;
  messageId: string;
  pollId: string;
  enabled?: boolean;
}

// Query hook for poll details
export const usePoll = (
  { householdId, threadId, messageId, pollId, enabled = true }: PollOptions,
  options?: Omit<UseQueryOptions<PollWithDetails>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: threadKeys.messages.polls.detail(
      householdId,
      threadId,
      messageId,
      pollId
    ),
    queryFn: async () => {
      const result = await threadApi.messages.polls.get(
        householdId,
        threadId,
        messageId,
        pollId
      );
      logger.debug("Poll data fetched", {
        pollId,
        messageId,
        threadId,
        householdId,
      });
      return result;
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: enabled && !!pollId && !!messageId && !!threadId && !!householdId,
    ...options,
  });
};

// Query hook for poll analytics
export const usePollAnalytics = (
  { householdId, threadId, messageId, pollId, enabled = true }: PollOptions,
  options?: Omit<
    UseQueryOptions<Record<string, number>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: threadKeys.messages.polls.analytics(
      householdId,
      threadId,
      messageId,
      pollId
    ),
    queryFn: async () => {
      const result = await threadApi.messages.polls.getAnalytics(
        householdId,
        threadId,
        messageId,
        pollId
      );
      logger.debug("Poll analytics fetched", {
        pollId,
        messageId,
        threadId,
        householdId,
      });
      return result.data;
    },
    staleTime: STALE_TIMES.SHORT,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: enabled && !!pollId && !!messageId && !!threadId && !!householdId,
    ...options,
  });
};

// Mutation hooks for poll operations
export const usePollOperations = ({
  householdId,
  threadId,
  messageId,
}: Omit<PollOptions, "pollId">) => {
  const queryClient = useQueryClient();

  const createPoll = useMutation({
    mutationFn: async (data: CreatePollDTO) => {
      const result = await threadApi.messages.polls.create(
        householdId,
        threadId,
        messageId,
        data
      );
      logger.info("Poll created", {
        messageId,
        threadId,
        householdId,
      });
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.list(householdId, threadId),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          result.id
        ),
      });
    },
  });

  return { createPoll };
};

// Mutation hooks for specific poll operations
export const usePollActions = ({
  householdId,
  threadId,
  messageId,
  pollId,
}: PollOptions) => {
  const queryClient = useQueryClient();

  const vote = useMutation({
    mutationFn: async (voteData: CreatePollVoteDTO) => {
      const result = await threadApi.messages.polls.vote(
        householdId,
        threadId,
        messageId,
        pollId,
        voteData
      );
      logger.info("Vote submitted", {
        pollId,
        messageId,
        threadId,
        householdId,
        optionId: voteData.optionId,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.polls.analytics(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });
    },
  });

  const removeVote = useMutation({
    mutationFn: async (voteId: string) => {
      await threadApi.messages.polls.removeVote(
        householdId,
        threadId,
        messageId,
        pollId,
        voteId
      );
      logger.info("Vote removed", {
        voteId,
        pollId,
        messageId,
        threadId,
        householdId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.polls.analytics(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: PollStatus) => {
      const result = await threadApi.messages.polls.update(
        householdId,
        threadId,
        messageId,
        pollId,
        { status }
      );
      logger.info("Poll status updated", {
        pollId,
        messageId,
        threadId,
        householdId,
        status,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.list(householdId, threadId),
      });
    },
  });

  return { vote, removeVote, updateStatus };
};

// Utility functions
export const pollUtils = {
  hasVoted: (poll: PollWithDetails | undefined, userId: string): boolean => {
    if (!poll) return false;
    return poll.options.some((option) =>
      option.votes.some((vote) => vote.user.id === userId)
    );
  },

  getVoteCount: (poll: PollWithDetails | undefined): number => {
    if (!poll) return 0;
    return poll.options.reduce(
      (total, option) => total + option.votes.length,
      0
    );
  },

  getUserVote: (
    poll: PollWithDetails | undefined,
    userId: string
  ): PollVoteWithUser | undefined => {
    if (!poll) return undefined;
    for (const option of poll.options) {
      const vote = option.votes.find((v) => v.user.id === userId);
      if (vote) return vote;
    }
    return undefined;
  },

  getOptionVotes: (
    poll: PollWithDetails | undefined,
    optionId: string
  ): PollVoteWithUser[] => {
    if (!poll) return [];
    const option = poll.options.find((o) => o.id === optionId);
    return option?.votes || [];
  },

  getOptionVoteCount: (
    poll: PollWithDetails | undefined,
    optionId: string
  ): number => {
    if (!poll) return 0;
    const option = poll.options.find((o) => o.id === optionId);
    return option?.votes.length || 0;
  },

  isOptionSelected: (
    poll: PollWithDetails | undefined,
    optionId: string
  ): boolean => {
    if (!poll) return false;
    return poll.selectedOptionId === optionId;
  },
};
