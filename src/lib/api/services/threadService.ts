import { ApiResponse, PaginationOptions } from "@shared/interfaces";
import {
  Thread,
  UpdateThreadDTO,
  MessageWithDetails,
  CreateMessageDTO,
  UpdateMessageDTO,
  Attachment,
  ThreadWithMessages,
  ThreadWithParticipants,
  CreateThreadDTO,
  MessageReadStatus,
  ReactionWithUser,
  CreateReactionDTO,
  MentionWithUser,
  CreateMentionDTO,
  PollWithDetails,
  CreatePollDTO,
  UpdatePollDTO,
  CreatePollVoteDTO,
  PollVoteWithUser,
  MessageReadWithUser,
  ThreadWithDetails,
} from "@shared/types";
import { BaseApiClient } from "../baseClient";
import { ReactionType } from "@shared/enums";
import { logger } from "@/lib/api/logger";

export class ThreadService extends BaseApiClient {
  /**
   * Thread Management
   */
  public readonly threads = {
    /**
     * Get all threads for a household
     */
    getThreads: async (
      householdId: string,
      options?: PaginationOptions,
      signal?: AbortSignal
    ): Promise<ApiResponse<ThreadWithDetails[]>> => {
      console.log("getThreads called");
      logger.debug("Getting threads", { householdId, options });

      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<ThreadWithDetails[]>>(
          `/households/${householdId}/threads`,
          {
            params: options,
            signal,
          }
        )
      );
    },

    /**
     * Create a new thread
     */
    createThread: async (
      householdId: string,
      threadData: CreateThreadDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<ThreadWithParticipants>> => {
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<ThreadWithParticipants>>(
          `/households/${householdId}/threads`,
          threadData,
          { signal }
        )
      );
    },

    /**
     * Get details of a specific thread
     */
    getThreadDetails: async (
      householdId: string,
      threadId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<ThreadWithMessages>> => {
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<ThreadWithMessages>>(
          `/households/${householdId}/threads/${threadId}`,
          { signal }
        )
      );
    },

    /**
     * Update a thread
     */
    updateThread: async (
      householdId: string,
      threadId: string,
      threadData: UpdateThreadDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<Thread>> => {
      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<Thread>>(
          `/households/${householdId}/threads/${threadId}`,
          threadData,
          { signal }
        )
      );
    },

    /**
     * Delete a thread
     */
    deleteThread: async (
      householdId: string,
      threadId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<void>> => {
      return this.handleRequest(() =>
        this.axiosInstance.delete<ApiResponse<void>>(
          `/households/${householdId}/threads/${threadId}`,
          {
            signal,
          }
        )
      );
    },

    /**
     * Invite users to a thread
     */
    inviteUsers: async (
      householdId: string,
      threadId: string,
      userIds: string[],
      signal?: AbortSignal
    ): Promise<ApiResponse<ThreadWithParticipants>> => {
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<ThreadWithParticipants>>(
          `/households/${householdId}/threads/${threadId}/invite`,
          { userIds },
          { signal }
        )
      );
    },
  };

  /**
   * Message Management
   */
  public readonly messages = {
    /**
     * Get all messages in a thread with pagination
     */
    getMessages: async (
      householdId: string,
      threadId: string,
      options?: PaginationOptions,
      signal?: AbortSignal
    ): Promise<ApiResponse<MessageWithDetails[]>> => {
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<MessageWithDetails[]>>(
          `/households/${householdId}/threads/${threadId}/messages`,
          {
            params: options,
            signal,
          }
        )
      );
    },

    /**
     * Create a new message
     */
    createMessage: async (
      householdId: string,
      threadId: string,
      messageData: CreateMessageDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<MessageWithDetails>> => {
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<MessageWithDetails>>(
          `/households/${householdId}/threads/${threadId}/messages`,
          messageData,
          { signal }
        )
      );
    },

    /**
     * Update a message
     */
    updateMessage: async (
      householdId: string,
      threadId: string,
      messageId: string,
      messageData: UpdateMessageDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<MessageWithDetails>> => {
      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<MessageWithDetails>>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}`,
          messageData,
          { signal }
        )
      );
    },

    /**
     * Delete a message
     */
    deleteMessage: async (
      householdId: string,
      threadId: string,
      messageId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<void>> => {
      return this.handleRequest(() =>
        this.axiosInstance.delete(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}`,
          { signal }
        )
      );
    },

    /**
     * Message Read Status
     */
    readStatus: {
      /**
       * Mark a message as read
       */
      markAsRead: async (
        householdId: string,
        threadId: string,
        messageId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<MessageReadStatus>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<MessageReadStatus>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/read-status`,
            { signal }
          )
        );
      },

      /**
       * Get read status of a message
       */
      getReadStatus: async (
        householdId: string,
        threadId: string,
        messageId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<MessageReadStatus>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<MessageReadStatus>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/read-status`,
            { signal }
          )
        );
      },
    },

    /**
     * Reactions Management
     */
    reactions: {
      /**
       * Add a reaction to a message
       */
      addReaction: async (
        householdId: string,
        threadId: string,
        messageId: string,
        reactionData: CreateReactionDTO,
        signal?: AbortSignal
      ): Promise<ApiResponse<ReactionWithUser>> => {
        return this.handleRequest(() =>
          this.axiosInstance.post<ApiResponse<ReactionWithUser>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions`,
            reactionData,
            { signal }
          )
        );
      },

      /**
       * Remove a reaction from a message
       */
      removeReaction: async (
        householdId: string,
        threadId: string,
        messageId: string,
        reactionId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<void>> => {
        return this.handleRequest(() =>
          this.axiosInstance.delete(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions/${reactionId}`,
            { signal }
          )
        );
      },

      /**
       * Get reactions for a message
       */
      getReactions: async (
        householdId: string,
        threadId: string,
        messageId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<ReactionWithUser[]>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<ReactionWithUser[]>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions`,
            { signal }
          )
        );
      },

      /**
       * Get reaction analytics
       */
      getReactionAnalytics: async (
        householdId: string,
        threadId: string,
        messageId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<Record<ReactionType, number>>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<Record<ReactionType, number>>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions/analytics`,
            { signal }
          )
        );
      },

      /**
       * Get reactions by type
       */
      getReactionsByType: async (
        householdId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<any>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<any>>(
            `/households/${householdId}/messages/reactions-by-type`,
            { signal }
          )
        );
      },
    },

    /**
     * Mentions Management
     */
    mentions: {
      /**
       * Create a mention
       */
      createMention: async (
        householdId: string,
        threadId: string,
        messageId: string,
        mentionData: CreateMentionDTO,
        signal?: AbortSignal
      ): Promise<ApiResponse<MentionWithUser>> => {
        return this.handleRequest(() =>
          this.axiosInstance.post<ApiResponse<MentionWithUser>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/mentions`,
            mentionData,
            { signal }
          )
        );
      },

      /**
       * Get user mentions
       */
      getUserMentions: async (
        householdId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<MentionWithUser[]>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<MentionWithUser[]>>(
            `/households/${householdId}/messages/mentions`,
            { signal }
          )
        );
      },

      /**
       * Get message mentions
       */
      getMessageMentions: async (
        householdId: string,
        threadId: string,
        messageId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<MentionWithUser[]>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<MentionWithUser[]>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/mentions`,
            { signal }
          )
        );
      },

      /**
       * Delete a mention
       */
      deleteMention: async (
        householdId: string,
        threadId: string,
        messageId: string,
        mentionId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<void>> => {
        return this.handleRequest(() =>
          this.axiosInstance.delete(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/mentions/${mentionId}`,
            { signal }
          )
        );
      },

      /**
       * Get unread mentions count
       */
      getUnreadMentionsCount: async (
        householdId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<number>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<number>>(
            `/households/${householdId}/messages/unread-mentions-count`,
            { signal }
          )
        );
      },
    },

    /**
     * Polls Management
     */
    polls: {
      /**
       * Get polls in thread
       */
      getPollsInThread: async (
        householdId: string,
        threadId: string,
        messageId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<PollWithDetails[]>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<PollWithDetails[]>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls`,
            { signal }
          )
        );
      },

      /**
       * Get a specific poll
       */
      getPoll: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<PollWithDetails>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<PollWithDetails>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}`,
            { signal }
          )
        );
      },

      /**
       * Create a poll
       */
      createPoll: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollData: CreatePollDTO,
        signal?: AbortSignal
      ): Promise<ApiResponse<PollWithDetails>> => {
        return this.handleRequest(() =>
          this.axiosInstance.post<ApiResponse<PollWithDetails>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls`,
            pollData,
            { signal }
          )
        );
      },

      /**
       * Update a poll
       */
      updatePoll: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        pollData: UpdatePollDTO,
        signal?: AbortSignal
      ): Promise<ApiResponse<PollWithDetails>> => {
        return this.handleRequest(() =>
          this.axiosInstance.patch<ApiResponse<PollWithDetails>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}`,
            pollData,
            { signal }
          )
        );
      },

      /**
       * Delete a poll
       */
      deletePoll: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<void>> => {
        return this.handleRequest(() =>
          this.axiosInstance.delete(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}`,
            { signal }
          )
        );
      },

      /**
       * Vote on a poll
       */
      votePoll: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        voteData: CreatePollVoteDTO,
        signal?: AbortSignal
      ): Promise<ApiResponse<PollVoteWithUser>> => {
        return this.handleRequest(() =>
          this.axiosInstance.post<ApiResponse<PollVoteWithUser>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}/vote`,
            voteData,
            { signal }
          )
        );
      },

      /**
       * Remove a vote from a poll
       */
      removePollVote: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        voteId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<void>> => {
        return this.handleRequest(() =>
          this.axiosInstance.delete(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}/vote`,
            {
              data: { voteId },
              signal,
            }
          )
        );
      },

      /**
       * Get poll analytics
       */
      getPollAnalytics: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<any>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<any>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}/analytics`,
            { signal }
          )
        );
      },
    },

    /**
     * Attachments Management
     */
    attachments: {
      /**
       * Get attachments for a message
       */
      getAttachments: async (
        householdId: string,
        threadId: string,
        messageId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<Attachment[]>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<Attachment[]>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments`,
            { signal }
          )
        );
      },

      /**
       * Add an attachment to a message
       */
      addAttachment: async (
        householdId: string,
        threadId: string,
        messageId: string,
        file: File,
        signal?: AbortSignal
      ): Promise<ApiResponse<Attachment>> => {
        const formData = new FormData();
        formData.append("file", file);
        return this.handleRequest(() =>
          this.axiosInstance.post<ApiResponse<Attachment>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              signal,
            }
          )
        );
      },

      /**
       * Get details of a specific attachment
       */
      getAttachment: async (
        householdId: string,
        threadId: string,
        messageId: string,
        attachmentId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<Attachment>> => {
        return this.handleRequest(() =>
          this.axiosInstance.get<ApiResponse<Attachment>>(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments/${attachmentId}`,
            { signal }
          )
        );
      },

      /**
       * Delete an attachment
       */
      deleteAttachment: async (
        householdId: string,
        threadId: string,
        messageId: string,
        attachmentId: string,
        signal?: AbortSignal
      ): Promise<ApiResponse<void>> => {
        return this.handleRequest(() =>
          this.axiosInstance.delete(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments/${attachmentId}`,
            { signal }
          )
        );
      },
    },

    /**
     * Mark a message as read
     */
    markAsRead: async (
      householdId: string,
      threadId: string,
      messageId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<MessageReadWithUser>> => {
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<MessageReadWithUser>>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/read`,
          {},
          { signal }
        )
      );
    },

    /**
     * Get read status for a message
     */
    getMessageReadStatus: async (
      householdId: string,
      threadId: string,
      messageId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<MessageReadStatus>> => {
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<MessageReadStatus>>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/read-status`,
          { signal }
        )
      );
    },
  };
}
