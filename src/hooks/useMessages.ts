"use client";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { logger } from "../lib/api/logger";
import {
  // Message actions
  fetchMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  // Reaction actions
  addReaction,
  removeReaction,
  getReactions,
  getReactionAnalytics,
  getReactionsByType,
  // Poll actions
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  removePollVote,
  getPoll,
  getPollsInThread,
  getPollAnalytics,
  // Attachment actions
  addAttachment,
  deleteAttachment,
  getAttachment,
  getAttachments,
  // Read status actions
  markMessageAsRead,
  getMessageReadStatus,
  // Mention actions
  createMention,
  deleteMention,
  getUserMentions,
  getMessageMentions,
  getUnreadMentionsCount,
  // State actions
  resetMessages,
  selectMessage,
  // Selectors
  selectMessages,
  selectMessageStatus,
  selectMessageError,
  selectHasMore,
  selectNextCursor,
  selectSelectedMessage,
} from "../store/slices/messagesSlice";

import type {
  MessageWithDetails,
  CreateMessageDTO,
  UpdateMessageDTO,
  CreateReactionDTO,
  CreatePollDTO,
  UpdatePollDTO,
  CreatePollVoteDTO,
  CreateMentionDTO,
  MessageReadStatus,
  PollWithDetails,
  Attachment,
  ReactionWithUser,
  MentionWithUser,
} from "@shared/types";

import { PaginationOptions } from "@shared/interfaces";
import type { RootState } from "../store/store";

export const useMessages = () => {
  const dispatch = useDispatch<AppDispatch>();

  logger.info("useMessages hook initialized");

  // Message selectors
  const messages = useSelector(selectMessages);
  const messageStatus = useSelector(selectMessageStatus);
  const messageError = useSelector(selectMessageError);
  const hasMore = useSelector(selectHasMore);
  const nextCursor = useSelector(selectNextCursor);
  const selectedMessage = useSelector(selectSelectedMessage);

  // Message actions
  const getMessages = useCallback(
    async (
      householdId: string,
      threadId: string,
      options?: PaginationOptions
    ) => {
      logger.info("Fetching messages", { householdId, threadId, options });
      try {
        const result = await dispatch(
          fetchMessages({ householdId, threadId, options })
        ).unwrap();
        logger.info("Messages fetched successfully", {
          messageCount: result.length,
          hasMore,
          nextCursor,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch messages", { error });
        throw error;
      }
    },
    [dispatch, hasMore, nextCursor]
  );

  const sendMessage = useCallback(
    async (
      householdId: string,
      threadId: string,
      messageData: CreateMessageDTO
    ) => {
      logger.info("Sending message", { threadId });
      try {
        const result = await dispatch(
          createMessage({ householdId, threadId, messageData })
        ).unwrap();
        logger.info("Message sent successfully", { messageId: result.id });
        return result;
      } catch (error) {
        logger.error("Failed to send message", { error });
        throw error;
      }
    },
    [dispatch]
  );

  const editMessage = useCallback(
    async (
      householdId: string,
      threadId: string,
      messageId: string,
      messageData: UpdateMessageDTO
    ) => {
      logger.info("Editing message", { messageId });
      try {
        const result = await dispatch(
          updateMessage({ householdId, threadId, messageId, messageData })
        ).unwrap();
        logger.info("Message edited successfully", { messageId });
        return result;
      } catch (error) {
        logger.error("Failed to edit message", { error });
        throw error;
      }
    },
    [dispatch]
  );

  const removeMessage = useCallback(
    async (householdId: string, threadId: string, messageId: string) => {
      logger.info("Removing message", { messageId });
      try {
        await dispatch(
          deleteMessage({ householdId, threadId, messageId })
        ).unwrap();
        logger.info("Message removed successfully", { messageId });
      } catch (error) {
        logger.error("Failed to remove message", { error });
        throw error;
      }
    },
    [dispatch]
  );

  // Reaction actions
  const addReaction = useCallback(
    async (
      householdId: string,
      threadId: string,
      messageId: string,
      reaction: CreateReactionDTO
    ) => {
      logger.info("Adding reaction", { messageId });
      try {
        const result = await dispatch(
          addReaction(householdId, threadId, messageId, reaction)
        ).unwrap();
        logger.info("Reaction added successfully");
        return result;
      } catch (error) {
        logger.error("Failed to add reaction", { error });
        throw error;
      }
    },
    [dispatch]
  );

  const removeReaction = useCallback(
    async (
      householdId: string,
      threadId: string,
      messageId: string,
      reactionId: string
    ) => {
      logger.info("Removing reaction", { messageId, reactionId });
      try {
        const result = await dispatch(
          removeReaction(householdId, threadId, messageId, reactionId)
        ).unwrap();
        logger.info("Reaction removed successfully");
        return result;
      } catch (error) {
        logger.error("Failed to remove reaction", { error });
        throw error;
      }
    },
    [dispatch]
  );

  // Poll actions
  const createPoll = useCallback(
    async (
      householdId: string,
      threadId: string,
      messageId: string,
      pollData: CreatePollDTO
    ) => {
      logger.info("Creating poll", { messageId });
      try {
        const result = await dispatch(
          createPoll(householdId, threadId, messageId, pollData)
        ).unwrap();
        logger.info("Poll created successfully");
        return result;
      } catch (error) {
        logger.error("Failed to create poll", { error });
        throw error;
      }
    },
    [dispatch]
  );

  const votePoll = useCallback(
    async (
      householdId: string,
      threadId: string,
      messageId: string,
      pollId: string,
      vote: CreatePollVoteDTO
    ) => {
      logger.info("Voting on poll", { messageId, pollId });
      try {
        const result = await dispatch(
          votePoll(householdId, threadId, messageId, pollId, vote)
        ).unwrap();
        logger.info("Poll vote submitted successfully");
        return result;
      } catch (error) {
        logger.error("Failed to vote on poll", { error });
        throw error;
      }
    },
    [dispatch]
  );

  // Attachment actions
  const addAttachment = useCallback(
    async (
      householdId: string,
      threadId: string,
      messageId: string,
      file: File
    ) => {
      logger.info("Adding attachment", { messageId });
      try {
        const result = await dispatch(
          addAttachment(householdId, threadId, messageId, file)
        ).unwrap();
        logger.info("Attachment added successfully");
        return result;
      } catch (error) {
        logger.error("Failed to add attachment", { error });
        throw error;
      }
    },
    [dispatch]
  );

  const deleteAttachment = useCallback(
    async (
      householdId: string,
      threadId: string,
      messageId: string,
      attachmentId: string
    ) => {
      logger.info("Deleting attachment", { messageId, attachmentId });
      try {
        const result = await dispatch(
          deleteAttachment(householdId, threadId, messageId, attachmentId)
        ).unwrap();
        logger.info("Attachment deleted successfully");
        return result;
      } catch (error) {
        logger.error("Failed to delete attachment", { error });
        throw error;
      }
    },
    [dispatch]
  );

  // Read status actions
  const markAsRead = useCallback(
    async (householdId: string, threadId: string, messageId: string) => {
      logger.info("Marking message as read", { messageId });
      try {
        const result = await dispatch(
          markMessageAsRead({ householdId, threadId, messageId })
        ).unwrap();
        logger.info("Message marked as read successfully");
        return result;
      } catch (error) {
        logger.error("Failed to mark message as read", { error });
        throw error;
      }
    },
    [dispatch]
  );

  return {
    // State
    messages,
    selectedMessage,
    messageStatus,
    messageError,
    hasMore,
    nextCursor,

    // Message actions
    getMessages,
    sendMessage,
    editMessage,
    removeMessage,

    // Poll actions
    createPoll,
    votePoll,

    // Reaction actions
    addReaction,
    removeReaction,

    // Attachment actions
    addAttachment,
    deleteAttachment,

    // Read status actions
    markAsRead,

    // Reset action
    reset: useCallback(() => {
      logger.info("Resetting messages state");
      dispatch(resetMessages());
    }, [dispatch]),
  };
};
