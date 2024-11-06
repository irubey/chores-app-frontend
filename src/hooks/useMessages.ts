"use client";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import {
  fetchMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  addAttachment,
  deleteAttachment,
  createPoll,
  updatePoll,
  votePoll,
  removePollVote,
  markMessageAsRead,
  resetMessages,
  selectMessages,
  selectMessageStatus,
  selectMessageError,
  selectHasMore,
  selectNextCursor,
  selectSelectedMessage,
  selectMessage,
  deleteMention,
  deletePoll,
  createMention,
  getMessageMentions as getMentions,
  getUserMentions,
  getUnreadMentionsCount,
  getReactionAnalytics,
  getReactionsByType,
  getPollAnalytics,
  getAttachments,
  getAttachment,
  getPollsInThread,
  getPoll,
  getMessageReadStatus,
} from "../store/slices/messagesSlice";

import {
  fetchThreads,
  createThread,
  fetchThreadDetails,
  updateThread,
  deleteThread,
  inviteUsersToThread,
  selectThreads,
  selectSelectedThread,
  selectThreadStatus,
  selectThreadError,
  selectThread,
} from "../store/slices/threadSlice";

import type {
  CreateMessageDTO,
  UpdateMessageDTO,
  CreateReactionDTO,
  CreatePollDTO,
  UpdatePollDTO,
  CreatePollVoteDTO,
  CreateMentionDTO,
  CreateAttachmentDTO,
} from "@shared/types";

export const useMessages = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Message selectors
  const messages = useSelector(selectMessages);
  const messageStatus = useSelector(selectMessageStatus);
  const messageError = useSelector(selectMessageError);
  const hasMore = useSelector(selectHasMore);
  const nextCursor = useSelector(selectNextCursor);
  const selectedMessage = useSelector(selectSelectedMessage);

  // Thread selectors
  const threads = useSelector(selectThreads);
  const selectedThread = useSelector(selectSelectedThread);
  const threadStatus = useSelector(selectThreadStatus);
  const threadError = useSelector(selectThreadError);

  // Thread actions
  const getThreads = (householdId: string) =>
    dispatch(fetchThreads({ householdId }));

  const startNewThread = (
    householdId: string,
    threadData: { title?: string; participants: string[] }
  ) =>
    dispatch(
      createThread({
        householdId,
        threadData: {
          ...threadData,
          householdId,
        },
      })
    );

  const getThreadDetails = (householdId: string, threadId: string) =>
    dispatch(fetchThreadDetails({ householdId, threadId }));

  const editThread = (
    householdId: string,
    threadId: string,
    threadData: { title?: string }
  ) => dispatch(updateThread({ householdId, threadId, threadData }));

  const removeThread = (householdId: string, threadId: string) =>
    dispatch(deleteThread({ householdId, threadId }));

  const inviteUsers = (
    householdId: string,
    threadId: string,
    userIds: string[]
  ) => dispatch(inviteUsersToThread({ householdId, threadId, userIds }));

  // Message actions
  const getMessages = (householdId: string, threadId: string) =>
    dispatch(fetchMessages({ householdId, threadId }));

  const sendNewMessage = (
    householdId: string,
    threadId: string,
    messageData: CreateMessageDTO
  ) => dispatch(createMessage({ householdId, threadId, messageData }));

  const editMessage = (
    householdId: string,
    threadId: string,
    messageId: string,
    messageData: UpdateMessageDTO
  ) =>
    dispatch(updateMessage({ householdId, threadId, messageId, messageData }));

  const removeMessage = (
    householdId: string,
    threadId: string,
    messageId: string
  ) => dispatch(deleteMessage({ householdId, threadId, messageId }));

  // Reaction actions
  const addMessageReaction = (
    householdId: string,
    threadId: string,
    messageId: string,
    reaction: CreateReactionDTO
  ) => dispatch(addReaction({ householdId, threadId, messageId, reaction }));

  const removeMessageReaction = (
    householdId: string,
    threadId: string,
    messageId: string,
    reactionId: string
  ) =>
    dispatch(removeReaction({ householdId, threadId, messageId, reactionId }));

  // Attachment actions
  const addMessageAttachment = (
    householdId: string,
    threadId: string,
    messageId: string,
    file: File
  ) => dispatch(addAttachment({ householdId, threadId, messageId, file }));

  const removeMessageAttachment = (
    householdId: string,
    threadId: string,
    messageId: string,
    attachmentId: string
  ) =>
    dispatch(
      deleteAttachment({ householdId, threadId, messageId, attachmentId })
    );

  const getMessageAttachments = (
    householdId: string,
    threadId: string,
    messageId: string
  ) => dispatch(getAttachments({ householdId, threadId, messageId }));

  const getMessageAttachment = (
    householdId: string,
    threadId: string,
    messageId: string,
    attachmentId: string
  ) =>
    dispatch(getAttachment({ householdId, threadId, messageId, attachmentId }));

  // Poll actions
  const createMessagePoll = (
    householdId: string,
    threadId: string,
    messageId: string,
    pollData: CreatePollDTO
  ) => dispatch(createPoll({ householdId, threadId, messageId, pollData }));

  const updateMessagePoll = (
    householdId: string,
    threadId: string,
    messageId: string,
    pollId: string,
    pollData: UpdatePollDTO
  ) =>
    dispatch(
      updatePoll({ householdId, threadId, messageId, pollId, pollData })
    );

  const deleteMessagePoll = (
    householdId: string,
    threadId: string,
    messageId: string,
    pollId: string
  ) => dispatch(deletePoll({ householdId, threadId, messageId, pollId }));

  const voteOnPoll = (
    householdId: string,
    threadId: string,
    messageId: string,
    pollId: string,
    vote: CreatePollVoteDTO
  ) => dispatch(votePoll({ householdId, threadId, messageId, pollId, vote }));

  const removeVoteFromPoll = (
    householdId: string,
    threadId: string,
    messageId: string,
    pollId: string,
    optionId: string
  ) =>
    dispatch(
      removePollVote({ householdId, threadId, messageId, pollId, optionId })
    );

  const getMessagePollAnalytics = (
    householdId: string,
    threadId: string,
    messageId: string,
    pollId: string
  ) => dispatch(getPollAnalytics({ householdId, threadId, messageId, pollId }));

  const getThreadPolls = (
    householdId: string,
    threadId: string,
    messageId: string
  ) => dispatch(getPollsInThread({ householdId, threadId, messageId }));

  const getPollDetails = (
    householdId: string,
    threadId: string,
    messageId: string,
    pollId: string
  ) => dispatch(getPoll({ householdId, threadId, messageId, pollId }));

  // Read status actions
  const markAsRead = (
    householdId: string,
    threadId: string,
    messageId: string
  ) => dispatch(markMessageAsRead({ householdId, threadId, messageId }));

  const getReadStatus = (
    householdId: string,
    threadId: string,
    messageId: string
  ) => dispatch(getMessageReadStatus({ householdId, threadId, messageId }));

  // Mention actions
  const createMessageMention = (
    householdId: string,
    threadId: string,
    messageId: string,
    mentionData: CreateMentionDTO
  ) =>
    dispatch(createMention({ householdId, threadId, messageId, mentionData }));

  const deleteMessageMention = (
    householdId: string,
    threadId: string,
    messageId: string,
    mentionId: string
  ) => dispatch(deleteMention({ householdId, threadId, messageId, mentionId }));

  const getMessageMentions = (
    householdId: string,
    threadId: string,
    messageId: string
  ) => dispatch(getMentions({ householdId, threadId, messageId }));

  const getUserMentionsList = (householdId: string) =>
    dispatch(getUserMentions({ householdId }));

  const getUnreadMentionsTotal = (householdId: string) =>
    dispatch(getUnreadMentionsCount({ householdId }));

  // Analytics actions
  const getMessageReactionAnalytics = (householdId: string) =>
    dispatch(getReactionAnalytics({ householdId }));

  const getMessageReactionsByType = (householdId: string) =>
    dispatch(getReactionsByType({ householdId }));

  // Reset action
  const reset = () => dispatch(resetMessages());

  return {
    // State
    messages,
    threads,
    selectedThread,
    selectedMessage,
    messageStatus,
    threadStatus,
    messageError,
    threadError,
    hasMore,
    nextCursor,

    // State management
    selectMessageById: (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        dispatch(selectMessage(message));
      }
    },
    selectThreadById: (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (thread) {
        dispatch(selectThread(thread));
      }
    },

    // Thread actions
    getThreads,
    startNewThread,
    getThreadDetails,
    editThread,
    removeThread,
    inviteUsers,

    // Message actions
    getMessages,
    sendNewMessage,
    editMessage,
    removeMessage,

    // Reaction actions
    addMessageReaction,
    removeMessageReaction,
    getMessageReactionAnalytics,
    getMessageReactionsByType,

    // Attachment actions
    addMessageAttachment,
    removeMessageAttachment,
    getMessageAttachments,
    getMessageAttachment,

    // Poll actions
    createMessagePoll,
    updateMessagePoll,
    deleteMessagePoll,
    voteOnPoll,
    removeVoteFromPoll,
    getMessagePollAnalytics,
    getThreadPolls,
    getPollDetails,

    // Read status actions
    markAsRead,
    getReadStatus,

    // Mention actions
    createMessageMention,
    deleteMessageMention,
    getMessageMentions,
    getUserMentionsList,
    getUnreadMentionsTotal,

    // Reset action
    reset,
  };
};
