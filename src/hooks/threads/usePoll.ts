// frontend/src/hooks/threads/usePoll.ts
import { useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import {
  PollWithDetails,
  CreatePollDTO,
  UpdatePollDTO,
  CreatePollVoteDTO,
  PollVoteWithUser,
  ThreadWithDetails,
} from "@shared/types";
import { PollStatus } from "@shared/enums/poll";
import { logger } from "@/lib/api/logger";
import { useSocket } from "@/contexts/SocketContext";
import { socketClient } from "@/lib/socketClient";
import { useUser } from "@/hooks/users/useUser";
import { getThreadById, getMessageById } from "./useThreads";
import { PollAnalytics } from "@/lib/api/services/threadService";

// Types
interface PollOptions {
  readonly householdId: string;
  readonly threadId: string;
  readonly messageId: string;
  readonly pollId: string;
}

/**
 * Hook for managing polls using thread data
 */
export const usePoll = ({
  householdId,
  threadId,
  messageId,
  pollId,
}: PollOptions) => {
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  useEffect(() => {
    if (!isConnected) return;

    const handlePollUpdate = (updatedPoll: PollWithDetails) => {
      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );

      if (threads) {
        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId ? { ...m, poll: updatedPoll } : m
                  ),
                }
              : t
          )
        );
      }

      logger.debug("Poll updated via socket", {
        pollId,
        messageId,
        threadId,
        householdId,
      });
    };

    const handlePollVote = (vote: PollVoteWithUser) => {
      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );

      if (threads) {
        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId && m.poll
                      ? {
                          ...m,
                          poll: {
                            ...m.poll,
                            options: m.poll.options.map((option) =>
                              option.id === vote.optionId
                                ? {
                                    ...option,
                                    votes: [...option.votes, vote],
                                    voteCount: option.voteCount + 1,
                                  }
                                : option
                            ),
                          },
                        }
                      : m
                  ),
                }
              : t
          )
        );
      }
    };

    const handleAnalyticsUpdate = (data: PollAnalytics) => {
      queryClient.setQueryData(
        threadKeys.messages.polls.analytics(
          householdId,
          threadId,
          messageId,
          pollId
        ),
        data
      );
    };

    socketClient.on(`poll:${pollId}:update`, handlePollUpdate);
    socketClient.on(`poll:${pollId}:vote:add`, handlePollVote);
    socketClient.on(`poll:${pollId}:analytics:update`, handleAnalyticsUpdate);

    return () => {
      socketClient.off(`poll:${pollId}:update`, handlePollUpdate);
      socketClient.off(`poll:${pollId}:vote:add`, handlePollVote);
      socketClient.off(
        `poll:${pollId}:analytics:update`,
        handleAnalyticsUpdate
      );
    };
  }, [isConnected, pollId, messageId, threadId, householdId, queryClient]);

  const updatePoll = useMutation({
    mutationFn: async (data: UpdatePollDTO) => {
      try {
        const result = await threadApi.messages.polls.update(
          householdId,
          threadId,
          messageId,
          pollId,
          data
        );
        logger.info("Poll updated", {
          pollId,
          messageId,
          threadId,
          householdId,
          updatedFields: Object.keys(data),
        });
        return result;
      } catch (error) {
        logger.error("Failed to update poll", {
          pollId,
          messageId,
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.list(householdId),
      });

      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );
      const thread = getThreadById(threads, threadId);
      const message = thread ? getMessageById(thread, messageId) : undefined;
      const previousPoll = message?.poll;

      if (threads && message?.poll) {
        const updatedPoll = {
          ...message.poll,
          ...data,
          updatedAt: new Date(),
        };

        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId ? { ...m, poll: updatedPoll } : m
                  ),
                }
              : t
          )
        );
      }

      return { previousPoll };
    },
    onError: (_, __, context) => {
      if (context?.previousPoll) {
        const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId)
        );

        if (threads) {
          queryClient.setQueryData<readonly ThreadWithDetails[]>(
            threadKeys.list(householdId),
            threads.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    messages: t.messages.map((m) =>
                      m.id === messageId
                        ? { ...m, poll: context.previousPoll }
                        : m
                    ),
                  }
                : t
            )
          );
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.list(householdId),
      });
    },
  });

  const vote = useMutation({
    mutationFn: async (data: CreatePollVoteDTO) => {
      try {
        const result = await threadApi.messages.polls.vote(
          householdId,
          threadId,
          messageId,
          pollId,
          data
        );
        logger.info("Poll vote added", {
          pollId,
          messageId,
          threadId,
          householdId,
          optionId: data.optionId,
        });
        return result;
      } catch (error) {
        logger.error("Failed to add poll vote", {
          pollId,
          messageId,
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.list(householdId),
      });

      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );
      const thread = getThreadById(threads, threadId);
      const message = thread ? getMessageById(thread, messageId) : undefined;
      const previousPoll = message?.poll;

      if (threads && message?.poll && currentUser) {
        const optimisticVote: PollVoteWithUser = {
          id: `temp-${Date.now()}`,
          pollId,
          userId: currentUser.id,
          optionId: data.optionId,
          rank: data.rank,
          availability: data.availability,
          createdAt: new Date(),
          user: currentUser,
        };

        const updatedPoll = {
          ...message.poll,
          options: message.poll.options.map((option) =>
            option.id === data.optionId
              ? {
                  ...option,
                  votes: [...option.votes, optimisticVote],
                  voteCount: option.voteCount + 1,
                }
              : option
          ),
        };

        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId ? { ...m, poll: updatedPoll } : m
                  ),
                }
              : t
          )
        );
      }

      return { previousPoll };
    },
    onError: (_, __, context) => {
      if (context?.previousPoll) {
        const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId)
        );

        if (threads) {
          queryClient.setQueryData<readonly ThreadWithDetails[]>(
            threadKeys.list(householdId),
            threads.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    messages: t.messages.map((m) =>
                      m.id === messageId
                        ? { ...m, poll: context.previousPoll }
                        : m
                    ),
                  }
                : t
            )
          );
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.list(householdId),
      });
    },
  });

  const prefetchPollAnalytics = async () => {
    return queryClient.prefetchQuery({
      queryKey: threadKeys.messages.polls.analytics(
        householdId,
        threadId,
        messageId,
        pollId
      ),
      queryFn: () =>
        threadApi.messages.polls.getAnalytics(
          householdId,
          threadId,
          messageId,
          pollId
        ),
    });
  };

  const invalidatePoll = async () => {
    await queryClient.invalidateQueries({
      queryKey: threadKeys.messages.polls.detail(
        householdId,
        threadId,
        messageId,
        pollId
      ),
    });
  };

  const analytics = useQuery({
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
      return result.data;
    },
    enabled: Boolean(pollId),
  });

  return {
    updatePoll,
    vote,
    prefetchPollAnalytics,
    invalidatePoll,
    analytics,
  };
};

// Poll utility functions
export const pollUtils = {
  hasVoted: (poll: PollWithDetails | undefined, userId: string): boolean => {
    if (!poll?.options) return false;
    return poll.options.some((option) =>
      option.votes.some((vote) => vote.userId === userId)
    );
  },

  getUserVote: (
    poll: PollWithDetails | undefined,
    userId: string
  ): PollVoteWithUser | undefined => {
    if (!poll?.options) return undefined;
    for (const option of poll.options) {
      const vote = option.votes.find((vote) => vote.userId === userId);
      if (vote) return vote;
    }
    return undefined;
  },

  getVoteCount: (poll: PollWithDetails | undefined): number => {
    if (!poll?.options) return 0;
    return poll.options.reduce((total, option) => total + option.voteCount, 0);
  },

  getOptionVoteCount: (
    poll: PollWithDetails | undefined,
    optionId: string
  ): number => {
    if (!poll?.options) return 0;
    const option = poll.options.find((opt) => opt.id === optionId);
    return option?.voteCount ?? 0;
  },

  getVotePercentage: (
    poll: PollWithDetails | undefined,
    optionId: string
  ): number => {
    if (!poll?.options) return 0;
    const totalVotes = pollUtils.getVoteCount(poll);
    if (totalVotes === 0) return 0;
    const optionVotes = pollUtils.getOptionVoteCount(poll, optionId);
    return (optionVotes / totalVotes) * 100;
  },

  getWinningOption: (poll: PollWithDetails | undefined) => {
    if (!poll?.options) return undefined;
    return [...poll.options].sort((a, b) => b.voteCount - a.voteCount)[0];
  },

  getVoteDistribution: (poll: PollWithDetails | undefined) => {
    if (!poll?.options) return {};
    const total = pollUtils.getVoteCount(poll);
    return poll.options.reduce(
      (acc, option) => ({
        ...acc,
        [option.id]: total ? (option.voteCount / total) * 100 : 0,
      }),
      {}
    );
  },

  isExpired: (poll: PollWithDetails | undefined): boolean => {
    if (!poll?.endDate) return false;
    return new Date() > new Date(poll.endDate);
  },

  canUserVote: (poll: PollWithDetails | undefined, userId: string): boolean => {
    if (!poll || pollUtils.isExpired(poll)) return false;
    return !pollUtils.hasVoted(poll, userId);
  },
};

export interface UsePollResult {
  updatePoll: ReturnType<typeof usePoll>["updatePoll"];
  vote: ReturnType<typeof usePoll>["vote"];
  analytics: ReturnType<typeof usePoll>["analytics"];
  prefetchPollAnalytics: () => Promise<void>;
  invalidatePoll: () => Promise<void>;
}
