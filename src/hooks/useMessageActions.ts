"use client";

import { useCallback } from "react";
import { apiClient } from "@/lib/api/apiClient";
import {
  CreateReactionDTO,
  CreatePollDTO,
  UpdatePollDTO,
  CreatePollVoteDTO,
  CreateMentionDTO,
  ReactionWithUser,
  PollWithDetails,
  MentionWithUser,
  MessageReadWithUser,
  Attachment,
} from "@shared/types";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";

export function useMessageActions(
  householdId: string,
  threadId: string,
  messageId: string
) {
  // Reactions
  const addReaction = useCallback(
    async (reaction: CreateReactionDTO) => {
      try {
        logger.debug("Adding reaction", {
          householdId,
          threadId,
          messageId,
          reaction,
        });

        const response = await apiClient.threads.messages.reactions.addReaction(
          householdId,
          threadId,
          messageId,
          reaction
        );

        logger.info("Successfully added reaction", {
          messageId,
          reactionId: response.data.id,
        });

        return response.data;
      } catch (error) {
        logger.error("Failed to add reaction", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to add reaction");
      }
    },
    [householdId, threadId, messageId]
  );

  const removeReaction = useCallback(
    async (reactionId: string) => {
      try {
        logger.debug("Removing reaction", {
          householdId,
          threadId,
          messageId,
          reactionId,
        });

        await apiClient.threads.messages.reactions.removeReaction(
          householdId,
          threadId,
          messageId,
          reactionId
        );

        logger.info("Successfully removed reaction", {
          messageId,
          reactionId,
        });
      } catch (error) {
        logger.error("Failed to remove reaction", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to remove reaction");
      }
    },
    [householdId, threadId, messageId]
  );

  // Polls
  const createPoll = useCallback(
    async (pollData: CreatePollDTO) => {
      try {
        logger.debug("Creating poll", {
          householdId,
          threadId,
          messageId,
          pollData,
        });

        const response = await apiClient.threads.messages.polls.createPoll(
          householdId,
          threadId,
          messageId,
          pollData
        );

        logger.info("Successfully created poll", {
          messageId,
          pollId: response.data.id,
        });

        return response.data;
      } catch (error) {
        logger.error("Failed to create poll", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to create poll");
      }
    },
    [householdId, threadId, messageId]
  );

  const updatePoll = useCallback(
    async (pollId: string, pollData: UpdatePollDTO) => {
      try {
        logger.debug("Updating poll", {
          householdId,
          threadId,
          messageId,
          pollId,
          pollData,
        });

        const response = await apiClient.threads.messages.polls.updatePoll(
          householdId,
          threadId,
          messageId,
          pollId,
          pollData
        );

        logger.info("Successfully updated poll", { messageId, pollId });

        return response.data;
      } catch (error) {
        logger.error("Failed to update poll", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to update poll");
      }
    },
    [householdId, threadId, messageId]
  );

  const votePoll = useCallback(
    async (pollId: string, vote: CreatePollVoteDTO) => {
      try {
        logger.debug("Voting on poll", {
          householdId,
          threadId,
          messageId,
          pollId,
          vote,
        });

        await apiClient.threads.messages.polls.votePoll(
          householdId,
          threadId,
          messageId,
          pollId,
          vote
        );

        // Fetch updated poll data
        const response = await apiClient.threads.messages.polls.getPoll(
          householdId,
          threadId,
          messageId,
          pollId
        );

        logger.info("Successfully voted on poll", { messageId, pollId });

        return response.data;
      } catch (error) {
        logger.error("Failed to vote on poll", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to vote on poll");
      }
    },
    [householdId, threadId, messageId]
  );

  // Attachments
  const addAttachment = useCallback(
    async (file: File) => {
      try {
        logger.debug("Adding attachment", {
          householdId,
          threadId,
          messageId,
          fileName: file.name,
        });

        const response =
          await apiClient.threads.messages.attachments.addAttachment(
            householdId,
            threadId,
            messageId,
            file
          );

        logger.info("Successfully added attachment", {
          messageId,
          attachmentId: response.data.id,
        });

        return response.data;
      } catch (error) {
        logger.error("Failed to add attachment", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to add attachment");
      }
    },
    [householdId, threadId, messageId]
  );

  const removeAttachment = useCallback(
    async (attachmentId: string) => {
      try {
        logger.debug("Removing attachment", {
          householdId,
          threadId,
          messageId,
          attachmentId,
        });

        await apiClient.threads.messages.attachments.deleteAttachment(
          householdId,
          threadId,
          messageId,
          attachmentId
        );

        logger.info("Successfully removed attachment", {
          messageId,
          attachmentId,
        });
      } catch (error) {
        logger.error("Failed to remove attachment", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to remove attachment");
      }
    },
    [householdId, threadId, messageId]
  );

  // Read Status
  const markAsRead = useCallback(async () => {
    try {
      logger.debug("Marking message as read", {
        householdId,
        threadId,
        messageId,
      });

      const response = await apiClient.threads.messages.markAsRead(
        householdId,
        threadId,
        messageId
      );

      logger.info("Successfully marked message as read", { messageId });

      return response.data;
    } catch (error) {
      logger.error("Failed to mark message as read", { error });
      throw error instanceof ApiError
        ? error
        : new Error("Failed to mark message as read");
    }
  }, [householdId, threadId, messageId]);

  // Mentions
  const addMention = useCallback(
    async (mentionData: CreateMentionDTO) => {
      try {
        logger.debug("Adding mention", {
          householdId,
          threadId,
          messageId,
          mentionData,
        });

        const response =
          await apiClient.threads.messages.mentions.createMention(
            householdId,
            threadId,
            messageId,
            mentionData
          );

        logger.info("Successfully added mention", {
          messageId,
          mentionId: response.data.id,
        });

        return response.data;
      } catch (error) {
        logger.error("Failed to add mention", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to add mention");
      }
    },
    [householdId, threadId, messageId]
  );

  // Read Status
  const getReadStatus = useCallback(async () => {
    try {
      logger.debug("Getting read status", {
        householdId,
        threadId,
        messageId,
      });

      const response = await apiClient.threads.messages.getMessageReadStatus(
        householdId,
        threadId,
        messageId
      );

      logger.info("Successfully got read status", { messageId });
      return response.data;
    } catch (error) {
      logger.error("Failed to get read status", { error });
      throw error instanceof ApiError
        ? error
        : new Error("Failed to get read status");
    }
  }, [householdId, threadId, messageId]);

  // Reactions
  const getReactions = useCallback(async () => {
    try {
      logger.debug("Getting reactions", {
        householdId,
        threadId,
        messageId,
      });

      const response = await apiClient.threads.messages.reactions.getReactions(
        householdId,
        threadId,
        messageId
      );

      logger.info("Successfully got reactions", { messageId });
      return response.data;
    } catch (error) {
      logger.error("Failed to get reactions", { error });
      throw error instanceof ApiError
        ? error
        : new Error("Failed to get reactions");
    }
  }, [householdId, threadId, messageId]);

  const getReactionAnalytics = useCallback(async () => {
    try {
      logger.debug("Getting reaction analytics", {
        householdId,
        threadId,
        messageId,
      });

      const response =
        await apiClient.threads.messages.reactions.getReactionAnalytics(
          householdId,
          threadId,
          messageId
        );

      logger.info("Successfully got reaction analytics", { messageId });
      return response.data;
    } catch (error) {
      logger.error("Failed to get reaction analytics", { error });
      throw error instanceof ApiError
        ? error
        : new Error("Failed to get reaction analytics");
    }
  }, [householdId, threadId, messageId]);

  // Mentions
  const getMessageMentions = useCallback(async () => {
    try {
      logger.debug("Getting message mentions", {
        householdId,
        threadId,
        messageId,
      });

      const response =
        await apiClient.threads.messages.mentions.getMessageMentions(
          householdId,
          threadId,
          messageId
        );

      logger.info("Successfully got message mentions", { messageId });
      return response.data;
    } catch (error) {
      logger.error("Failed to get message mentions", { error });
      throw error instanceof ApiError
        ? error
        : new Error("Failed to get message mentions");
    }
  }, [householdId, threadId, messageId]);

  const deleteMention = useCallback(
    async (mentionId: string) => {
      try {
        logger.debug("Deleting mention", {
          householdId,
          threadId,
          messageId,
          mentionId,
        });

        await apiClient.threads.messages.mentions.deleteMention(
          householdId,
          threadId,
          messageId,
          mentionId
        );

        logger.info("Successfully deleted mention", { messageId, mentionId });
      } catch (error) {
        logger.error("Failed to delete mention", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to delete mention");
      }
    },
    [householdId, threadId, messageId]
  );

  // Polls
  const getPollsInThread = useCallback(async () => {
    try {
      logger.debug("Getting polls in thread", {
        householdId,
        threadId,
        messageId,
      });

      const response = await apiClient.threads.messages.polls.getPollsInThread(
        householdId,
        threadId,
        messageId
      );

      logger.info("Successfully got polls in thread", { messageId });
      return response.data;
    } catch (error) {
      logger.error("Failed to get polls in thread", { error });
      throw error instanceof ApiError
        ? error
        : new Error("Failed to get polls in thread");
    }
  }, [householdId, threadId, messageId]);

  const deletePoll = useCallback(
    async (pollId: string) => {
      try {
        logger.debug("Deleting poll", {
          householdId,
          threadId,
          messageId,
          pollId,
        });

        await apiClient.threads.messages.polls.deletePoll(
          householdId,
          threadId,
          messageId,
          pollId
        );

        logger.info("Successfully deleted poll", { messageId, pollId });
      } catch (error) {
        logger.error("Failed to delete poll", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to delete poll");
      }
    },
    [householdId, threadId, messageId]
  );

  const removePollVote = useCallback(
    async (pollId: string, voteId: string) => {
      try {
        logger.debug("Removing poll vote", {
          householdId,
          threadId,
          messageId,
          pollId,
          voteId,
        });

        await apiClient.threads.messages.polls.removePollVote(
          householdId,
          threadId,
          messageId,
          pollId,
          voteId
        );

        logger.info("Successfully removed poll vote", {
          messageId,
          pollId,
          voteId,
        });
      } catch (error) {
        logger.error("Failed to remove poll vote", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to remove poll vote");
      }
    },
    [householdId, threadId, messageId]
  );

  const getPollAnalytics = useCallback(
    async (pollId: string) => {
      try {
        logger.debug("Getting poll analytics", {
          householdId,
          threadId,
          messageId,
          pollId,
        });

        const response =
          await apiClient.threads.messages.polls.getPollAnalytics(
            householdId,
            threadId,
            messageId,
            pollId
          );

        logger.info("Successfully got poll analytics", { messageId, pollId });
        return response.data;
      } catch (error) {
        logger.error("Failed to get poll analytics", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to get poll analytics");
      }
    },
    [householdId, threadId, messageId]
  );

  // Attachments
  const getAttachments = useCallback(async () => {
    try {
      logger.debug("Getting attachments", {
        householdId,
        threadId,
        messageId,
      });

      const response =
        await apiClient.threads.messages.attachments.getAttachments(
          householdId,
          threadId,
          messageId
        );

      logger.info("Successfully got attachments", { messageId });
      return response.data;
    } catch (error) {
      logger.error("Failed to get attachments", { error });
      throw error instanceof ApiError
        ? error
        : new Error("Failed to get attachments");
    }
  }, [householdId, threadId, messageId]);

  const getAttachment = useCallback(
    async (attachmentId: string) => {
      try {
        logger.debug("Getting attachment", {
          householdId,
          threadId,
          messageId,
          attachmentId,
        });

        const response =
          await apiClient.threads.messages.attachments.getAttachment(
            householdId,
            threadId,
            messageId,
            attachmentId
          );

        logger.info("Successfully got attachment", { messageId, attachmentId });
        return response.data;
      } catch (error) {
        logger.error("Failed to get attachment", { error });
        throw error instanceof ApiError
          ? error
          : new Error("Failed to get attachment");
      }
    },
    [householdId, threadId, messageId]
  );

  return {
    // Reactions
    addReaction,
    removeReaction,
    // Polls
    createPoll,
    updatePoll,
    votePoll,
    // Attachments
    addAttachment,
    removeAttachment,
    // Read Status
    markAsRead,
    // Mentions
    addMention,
    // Read Status
    getReadStatus,
    // Reactions
    getReactions,
    getReactionAnalytics,
    // Mentions
    getMessageMentions,
    deleteMention,
    // Polls
    getPollsInThread,
    deletePoll,
    removePollVote,
    getPollAnalytics,
    // Attachments
    getAttachments,
    getAttachment,
  };
}
