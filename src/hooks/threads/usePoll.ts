// frontend/src/hooks/threads/usePoll.ts
import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import {
  PollWithDetails,
  CreatePollDTO,
  UpdatePollDTO,
  CreatePollVoteDTO,
  PollVoteWithUser,
} from "@shared/types";
import { PollStatus } from "@shared/enums/poll";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { logger } from "@/lib/api/logger";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { useSocket } from "@/contexts/SocketContext";
import { socketClient } from "@/lib/socketClient";
import { useUser } from "@/hooks/users/useUser";

// Types
interface PollOptions {
  readonly householdId: string;
  readonly threadId: string;
  readonly messageId: string;
  readonly pollId: string;
  readonly enabled?: boolean;
}

interface MutationContext {
  readonly previousPoll: PollWithDetails | undefined;
}

interface OptimisticPollVote {
  readonly id: string;
  readonly optionId: string;
  readonly pollId: string;
  readonly userId: string;
  readonly rank?: number;
  readonly availability?: boolean;
  readonly createdAt: Date;
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly profileImageURL: null;
    readonly activeHouseholdId: null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  };
}

/**
 * Hook for managing a single poll with real-time updates
 */
export const usePoll = (
  { householdId, threadId, messageId, pollId, enabled = true }: PollOptions,
  options?: Omit<UseQueryOptions<PollWithDetails>, "queryKey" | "queryFn">
) => {
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  useEffect(() => {
    if (!isConnected || !enabled) return;

    const handlePollUpdate = (updatedPoll: PollWithDetails) => {
      queryClient.setQueryData(
        threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
        updatedPoll
      );
      logger.debug("Poll updated via socket", {
        pollId,
        messageId,
        threadId,
        householdId,
      });
    };

    const handlePollVote = (vote: PollVoteWithUser) => {
      queryClient.setQueryData<PollWithDetails>(
        threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            options: old.options.map((option) =>
              option.id === vote.optionId
                ? {
                    ...option,
                    votes: [...option.votes, vote],
                    voteCount: option.voteCount + 1,
                  }
                : option
            ),
          };
        }
      );
      logger.debug("Poll vote added via socket", {
        pollId,
        messageId,
        threadId,
        householdId,
        voteId: vote.id,
      });
    };

    const handlePollVoteRemove = (voteId: string) => {
      queryClient.setQueryData<PollWithDetails>(
        threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            options: old.options.map((option) => ({
              ...option,
              votes: option.votes.filter((v) => v.id !== voteId),
              voteCount:
                option.voteCount -
                (option.votes.some((v) => v.id === voteId) ? 1 : 0),
            })),
          };
        }
      );
      logger.debug("Poll vote removed via socket", {
        pollId,
        messageId,
        threadId,
        householdId,
        voteId,
      });
    };

    // Subscribe to socket events
    socketClient.on(`poll:${pollId}:update`, handlePollUpdate);
    socketClient.on(`poll:${pollId}:vote:add`, handlePollVote);
    socketClient.on(`poll:${pollId}:vote:remove`, handlePollVoteRemove);

    logger.debug("Subscribed to poll socket events", {
      pollId,
      messageId,
      threadId,
      householdId,
      events: [
        `poll:${pollId}:update`,
        `poll:${pollId}:vote:add`,
        `poll:${pollId}:vote:remove`,
      ],
    });

    return () => {
      // Cleanup socket subscriptions
      socketClient.off(`poll:${pollId}:update`, handlePollUpdate);
      socketClient.off(`poll:${pollId}:vote:add`, handlePollVote);
      socketClient.off(`poll:${pollId}:vote:remove`, handlePollVoteRemove);

      logger.debug("Unsubscribed from poll socket events", {
        pollId,
        messageId,
        threadId,
        householdId,
      });
    };
  }, [
    isConnected,
    pollId,
    messageId,
    threadId,
    householdId,
    enabled,
    queryClient,
  ]);

  const query = useQuery({
    queryKey: threadKeys.messages.polls.detail(
      householdId,
      threadId,
      messageId,
      pollId
    ),
    queryFn: async () => {
      try {
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
      } catch (error) {
        logger.error("Failed to fetch poll", {
          pollId,
          messageId,
          threadId,
          householdId,
          error,
        });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled:
      enabled &&
      Boolean(pollId) &&
      Boolean(messageId) &&
      Boolean(threadId) &&
      Boolean(householdId),
    ...options,
  });

  const updatePoll = useMutation<
    PollWithDetails,
    Error,
    UpdatePollDTO,
    MutationContext
  >({
    mutationFn: async (data) => {
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
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });

      const previousPoll = queryClient.getQueryData<PollWithDetails>(
        threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        )
      );

      if (previousPoll) {
        const optimisticPoll: PollWithDetails = {
          ...previousPoll,
          ...data,
          updatedAt: new Date(),
        };

        queryClient.setQueryData<PollWithDetails>(
          threadKeys.messages.polls.detail(
            householdId,
            threadId,
            messageId,
            pollId
          ),
          optimisticPoll
        );
      }

      return { previousPoll };
    },
    onError: (_, __, context) => {
      if (context?.previousPoll) {
        queryClient.setQueryData(
          threadKeys.messages.polls.detail(
            householdId,
            threadId,
            messageId,
            pollId
          ),
          context.previousPoll
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });
    },
  });

  const vote = useMutation<
    PollVoteWithUser,
    Error,
    CreatePollVoteDTO,
    MutationContext
  >({
    mutationFn: async (data) => {
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
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });

      const previousPoll = queryClient.getQueryData<PollWithDetails>(
        threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        )
      );

      if (previousPoll && currentUser) {
        const now = new Date();
        const optimisticVote: OptimisticPollVote = {
          id: `temp-${now.getTime()}`,
          pollId,
          userId: currentUser.id,
          optionId: data.optionId,
          rank: data.rank,
          availability: data.availability,
          createdAt: now,
          user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            profileImageURL: null,
            activeHouseholdId: null,
            createdAt: now,
            updatedAt: now,
          },
        };

        const optimisticPoll: PollWithDetails = {
          ...previousPoll,
          options: previousPoll.options.map((option) =>
            option.id === data.optionId
              ? {
                  ...option,
                  votes: [...option.votes, optimisticVote as PollVoteWithUser],
                  voteCount: option.voteCount + 1,
                }
              : option
          ),
          updatedAt: now,
        };

        queryClient.setQueryData<PollWithDetails>(
          threadKeys.messages.polls.detail(
            householdId,
            threadId,
            messageId,
            pollId
          ),
          optimisticPoll
        );
      }

      return { previousPoll };
    },
    onError: (_, __, context) => {
      if (context?.previousPoll) {
        queryClient.setQueryData(
          threadKeys.messages.polls.detail(
            householdId,
            threadId,
            messageId,
            pollId
          ),
          context.previousPoll
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });
    },
  });

  const removeVote = useMutation<void, Error, string, MutationContext>({
    mutationFn: async (voteId) => {
      try {
        await threadApi.messages.polls.removeVote(
          householdId,
          threadId,
          messageId,
          pollId,
          voteId
        );
        logger.info("Poll vote removed", {
          pollId,
          messageId,
          threadId,
          householdId,
          voteId,
        });
      } catch (error) {
        logger.error("Failed to remove poll vote", {
          pollId,
          messageId,
          threadId,
          householdId,
          voteId,
          error,
        });
        throw error;
      }
    },
    onMutate: async (voteId) => {
      await queryClient.cancelQueries({
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });

      const previousPoll = queryClient.getQueryData<PollWithDetails>(
        threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        )
      );

      if (previousPoll) {
        const optimisticPoll: PollWithDetails = {
          ...previousPoll,
          options: previousPoll.options.map((option) => ({
            ...option,
            votes: option.votes.filter((v) => v.id !== voteId),
            voteCount:
              option.voteCount -
              (option.votes.some((v) => v.id === voteId) ? 1 : 0),
          })),
          updatedAt: new Date(),
        };

        queryClient.setQueryData<PollWithDetails>(
          threadKeys.messages.polls.detail(
            householdId,
            threadId,
            messageId,
            pollId
          ),
          optimisticPoll
        );
      }

      return { previousPoll };
    },
    onError: (_, __, context) => {
      if (context?.previousPoll) {
        queryClient.setQueryData(
          threadKeys.messages.polls.detail(
            householdId,
            threadId,
            messageId,
            pollId
          ),
          context.previousPoll
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.messages.polls.detail(
          householdId,
          threadId,
          messageId,
          pollId
        ),
      });
    },
  });

  return {
    ...query,
    updatePoll,
    vote,
    removeVote,
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
};
