// frontend/src/hooks/threads/usePoll.ts
import { useCallback, useState } from "react";
import { ThreadService } from "@/lib/api/services/threadService";
import {
  PollWithDetails,
  CreatePollDTO,
  UpdatePollDTO,
  CreatePollVoteDTO,
  PollVoteWithUser,
} from "@shared/types";
import { PollType, PollStatus } from "@shared/enums";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/api/logger";

interface UsePollOptions {
  householdId: string;
  threadId: string;
  messageId: string;
  initialPoll?: PollWithDetails;
  onUpdate?: () => Promise<void>;
}

interface PollState {
  poll: PollWithDetails | null;
  isLoading: {
    poll: boolean;
    vote: boolean;
    update: boolean;
  };
  error: Error | null;
}

export function usePoll({
  householdId,
  threadId,
  messageId,
  initialPoll,
  onUpdate,
}: UsePollOptions) {
  const [state, setState] = useState<PollState>({
    poll: initialPoll || null,
    isLoading: {
      poll: false,
      vote: false,
      update: false,
    },
    error: null,
  });

  const { user } = useAuth();
  const threadService = new ThreadService();

  // Create a new poll
  const createPoll = useCallback(
    async (data: CreatePollDTO) => {
      if (!user) return;

      try {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, poll: true },
        }));

        logger.debug("Creating poll", { messageId, data });

        const response = await threadService.messages.polls.createPoll(
          householdId,
          threadId,
          messageId,
          data
        );

        setState((prev) => ({
          ...prev,
          poll: response.data,
        }));

        onUpdate?.();
        logger.info("Poll created successfully", {
          messageId,
          pollId: response.data.id,
        });
      } catch (error) {
        logger.error("Error creating poll", { error, messageId });
        setState((prev) => ({ ...prev, error: error as Error }));
        throw error;
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, poll: false },
        }));
      }
    },
    [householdId, threadId, messageId, user, onUpdate]
  );

  // Vote on a poll
  const vote = useCallback(
    async (pollId: string, voteData: CreatePollVoteDTO) => {
      if (!user || !state.poll) return;

      try {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, vote: true },
        }));

        logger.debug("Voting on poll", { messageId, pollId, voteData });

        const response = await threadService.messages.polls.votePoll(
          householdId,
          threadId,
          messageId,
          pollId,
          voteData
        );

        // Update poll state with new vote
        const updatedPoll = await threadService.messages.polls.getPoll(
          householdId,
          threadId,
          messageId,
          pollId
        );

        setState((prev) => ({
          ...prev,
          poll: updatedPoll.data,
        }));

        onUpdate?.();
        logger.info("Vote submitted successfully", { messageId, pollId });
      } catch (error) {
        logger.error("Error voting on poll", { error, messageId, pollId });
        setState((prev) => ({ ...prev, error: error as Error }));
        throw error;
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, vote: false },
        }));
      }
    },
    [householdId, threadId, messageId, user, state.poll, onUpdate]
  );

  // Remove a vote from a poll
  const removeVote = useCallback(
    async (pollId: string, voteId: string) => {
      if (!user || !state.poll) return;

      try {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, vote: true },
        }));

        logger.debug("Removing vote from poll", { messageId, pollId, voteId });

        await threadService.messages.polls.removePollVote(
          householdId,
          threadId,
          messageId,
          pollId,
          voteId
        );

        // Update poll state after vote removal
        const updatedPoll = await threadService.messages.polls.getPoll(
          householdId,
          threadId,
          messageId,
          pollId
        );

        setState((prev) => ({
          ...prev,
          poll: updatedPoll.data,
        }));

        onUpdate?.();
        logger.info("Vote removed successfully", { messageId, pollId, voteId });
      } catch (error) {
        logger.error("Error removing vote", { error, messageId, pollId });
        setState((prev) => ({ ...prev, error: error as Error }));
        throw error;
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, vote: false },
        }));
      }
    },
    [householdId, threadId, messageId, user, state.poll, onUpdate]
  );

  // Update poll status
  const updatePollStatus = useCallback(
    async (pollId: string, status: PollStatus) => {
      if (!user || !state.poll) return;

      try {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, update: true },
        }));

        logger.debug("Updating poll status", { messageId, pollId, status });

        const updateData: UpdatePollDTO = { status };
        await threadService.messages.polls.updatePoll(
          householdId,
          threadId,
          messageId,
          pollId,
          updateData
        );

        // Get updated poll data
        const updatedPoll = await threadService.messages.polls.getPoll(
          householdId,
          threadId,
          messageId,
          pollId
        );

        setState((prev) => ({
          ...prev,
          poll: updatedPoll.data,
        }));

        onUpdate?.();
        logger.info("Poll status updated successfully", {
          messageId,
          pollId,
          status,
        });
      } catch (error) {
        logger.error("Error updating poll status", {
          error,
          messageId,
          pollId,
        });
        setState((prev) => ({ ...prev, error: error as Error }));
        throw error;
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: { ...prev.isLoading, update: false },
        }));
      }
    },
    [householdId, threadId, messageId, user, state.poll, onUpdate]
  );

  // Get poll analytics
  const getPollAnalytics = useCallback(
    async (pollId: string) => {
      if (!user || !state.poll) return null;

      try {
        logger.debug("Getting poll analytics", { messageId, pollId });

        const response = await threadService.messages.polls.getPollAnalytics(
          householdId,
          threadId,
          messageId,
          pollId
        );

        logger.info("Poll analytics fetched successfully", {
          messageId,
          pollId,
        });
        return response.data;
      } catch (error) {
        logger.error("Error fetching poll analytics", {
          error,
          messageId,
          pollId,
        });
        throw error;
      }
    },
    [householdId, threadId, messageId, user, state.poll]
  );

  // Check if user has voted
  const hasVoted = useCallback(
    (pollId: string) => {
      if (!user || !state.poll) return false;
      return state.poll.options.some((option) =>
        option.votes.some((vote) => vote.user.id === user.id)
      );
    },
    [user, state.poll]
  );

  return {
    ...state,
    createPoll,
    vote,
    removeVote,
    updatePollStatus,
    getPollAnalytics,
    hasVoted,
  };
}
