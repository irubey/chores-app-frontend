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
} from "@shared/types";
import { ReactionType } from "@shared/enums";
import { BaseApiClient } from "../baseClient";

export class ThreadService extends BaseApiClient {
  /**
   * Get all threads for a household
   */
  public async getThreads(
    householdId: string,
    signal?: AbortSignal
  ): Promise<ThreadWithMessages[]> {
    const response = await this.axiosInstance.get<
      ApiResponse<ThreadWithMessages[]>
    >(`/households/${householdId}/threads`, { signal });
    return this.extractData(response);
  }

  /**
   * Create a new thread
   */
  public async createThread(
    householdId: string,
    threadData: CreateThreadDTO,
    signal?: AbortSignal
  ): Promise<ThreadWithParticipants> {
    const response = await this.axiosInstance.post<
      ApiResponse<ThreadWithParticipants>
    >(`/households/${householdId}/threads`, threadData, { signal });
    return this.extractData(response);
  }

  /**
   * Get details of a specific thread
   */
  public async getThreadDetails(
    householdId: string,
    threadId: string,
    signal?: AbortSignal
  ): Promise<ThreadWithMessages> {
    const response = await this.axiosInstance.get<
      ApiResponse<ThreadWithMessages>
    >(`/households/${householdId}/threads/${threadId}`, { signal });
    return this.extractData(response);
  }

  /**
   * Update a thread
   */
  public async updateThread(
    householdId: string,
    threadId: string,
    threadData: UpdateThreadDTO,
    signal?: AbortSignal
  ): Promise<Thread> {
    const response = await this.axiosInstance.patch<ApiResponse<Thread>>(
      `/households/${householdId}/threads/${threadId}`,
      threadData,
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Delete a thread
   */
  public async deleteThread(
    householdId: string,
    threadId: string,
    signal?: AbortSignal
  ): Promise<void> {
    await this.axiosInstance.delete(
      `/households/${householdId}/threads/${threadId}`,
      { signal }
    );
  }

  /**
   * Invite users to a thread
   */
  public async inviteUsers(
    householdId: string,
    threadId: string,
    userIds: string[],
    signal?: AbortSignal
  ): Promise<ThreadWithParticipants> {
    const response = await this.axiosInstance.post<
      ApiResponse<ThreadWithParticipants>
    >(
      `/households/${householdId}/threads/${threadId}/invite`,
      {
        userIds,
      },
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Messages management
   */
  public readonly messages = {
    /**
     * Get all messages in a thread
     */
    getMessages: async (
      householdId: string,
      threadId: string,
      signal?: AbortSignal,
      options?: PaginationOptions
    ): Promise<ApiResponse<MessageWithDetails[]>> => {
      const response = await this.axiosInstance.get<
        ApiResponse<MessageWithDetails[]>
      >(`/households/${householdId}/threads/${threadId}/messages`, {
        params: options,
        signal,
      });
      return response.data;
    },

    /**
     * Create a new message
     */
    createMessage: async (
      householdId: string,
      threadId: string,
      messageData: CreateMessageDTO,
      signal?: AbortSignal
    ): Promise<MessageWithDetails> => {
      const response = await this.axiosInstance.post<
        ApiResponse<MessageWithDetails>
      >(
        `/households/${householdId}/threads/${threadId}/messages`,
        messageData,
        {
          signal,
        }
      );
      return this.extractData(response);
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
    ): Promise<MessageWithDetails> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<MessageWithDetails>
      >(
        `/households/${householdId}/threads/${threadId}/messages/${messageId}`,
        messageData,
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Delete a message
     */
    deleteMessage: async (
      householdId: string,
      threadId: string,
      messageId: string,
      signal?: AbortSignal
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/threads/${threadId}/messages/${messageId}`,
        { signal }
      );
    },

    /**
     * Mark a message as read
     */
    markAsRead: async (
      householdId: string,
      threadId: string,
      messageId: string,
      signal?: AbortSignal
    ): Promise<void> => {
      await this.axiosInstance.patch(
        `/households/${householdId}/threads/${threadId}/messages/${messageId}/read`,
        {},
        { signal }
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
    ): Promise<MessageReadStatus> => {
      const response = await this.axiosInstance.get<
        ApiResponse<MessageReadStatus>
      >(
        `/households/${householdId}/threads/${threadId}/messages/${messageId}/read-status`,
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Reactions management
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
      ): Promise<ReactionWithUser> => {
        const response = await this.axiosInstance.post<
          ApiResponse<ReactionWithUser>
        >(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions`,
          reactionData,
          { signal }
        );
        return this.extractData(response);
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
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions/${reactionId}`,
          { signal }
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
      ): Promise<ReactionWithUser[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<ReactionWithUser[]>
        >(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions`,
          { signal }
        );
        return this.extractData(response);
      },

      /**
       * Get reaction analytics for a message
       */
      getAnalytics: async (
        householdId: string,
        threadId: string,
        messageId: string,
        signal?: AbortSignal
      ): Promise<Record<ReactionType, number>> => {
        const response = await this.axiosInstance.get<
          ApiResponse<Record<ReactionType, number>>
        >(`/households/${householdId}/messages/reaction-analytics`, { signal });
        return this.extractData(response);
      },

      /**
       * Get reactions by type for a message
       */
      getByType: async (
        householdId: string,
        threadId: string,
        messageId: string,
        type: ReactionType,
        signal?: AbortSignal
      ): Promise<ReactionWithUser[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<ReactionWithUser[]>
        >(`/households/${householdId}/messages/reactions-by-type`, {
          signal,
          params: { type },
        });
        return this.extractData(response);
      },
    },

    /**
     * Mentions management
     */
    mentions: {
      /**
       * Create a mention for a message
       */
      createMention: async (
        householdId: string,
        threadId: string,
        messageId: string,
        mentionData: CreateMentionDTO,
        signal?: AbortSignal
      ): Promise<MentionWithUser> => {
        const response = await this.axiosInstance.post<
          ApiResponse<MentionWithUser>
        >(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/mentions`,
          mentionData,
          { signal }
        );
        return this.extractData(response);
      },

      /**
       * Get user mentions
       */
      getUserMentions: async (
        householdId: string,
        signal?: AbortSignal
      ): Promise<MentionWithUser[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<MentionWithUser[]>
        >(`/households/${householdId}/messages/mentions`, { signal });
        return this.extractData(response);
      },

      /**
       * Get message mentions
       */
      getMessageMentions: async (
        householdId: string,
        threadId: string,
        messageId: string,
        signal?: AbortSignal
      ): Promise<MentionWithUser[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<MentionWithUser[]>
        >(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/mentions`,
          { signal }
        );
        return this.extractData(response);
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
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/mentions/${mentionId}`,
          { signal }
        );
      },

      /**
       * Get unread mention count
       */
      getUnreadCount: async (
        householdId: string,
        signal?: AbortSignal
      ): Promise<number> => {
        const response = await this.axiosInstance.get<ApiResponse<number>>(
          `/households/${householdId}/messages/unread-mentions-count`,
          { signal }
        );
        return this.extractData(response);
      },
    },

    /**
     * Attachments management
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
      ): Promise<Attachment[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<Attachment[]>
        >(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments`,
          { signal }
        );
        return this.extractData(response);
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
      ): Promise<Attachment> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await this.axiosInstance.post<ApiResponse<Attachment>>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            signal,
          }
        );
        return this.extractData(response);
      },

      /**
       * Get details of a specific attachment
       */
      getAttachmentDetails: async (
        householdId: string,
        threadId: string,
        messageId: string,
        attachmentId: string,
        signal?: AbortSignal
      ): Promise<Attachment> => {
        const response = await this.axiosInstance.get<ApiResponse<Attachment>>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments/${attachmentId}`,
          { signal }
        );
        return this.extractData(response);
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
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments/${attachmentId}`,
          { signal }
        );
      },
    },

    /**
     * Get unread mention count
     */
    getUnreadMentionsCount: async (
      householdId: string,
      signal?: AbortSignal
    ): Promise<number> => {
      const response = await this.axiosInstance.get<ApiResponse<number>>(
        `/households/${householdId}/messages/unread-mentions-count`,
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Get reaction analytics
     */
    getReactionAnalytics: async (
      householdId: string,
      signal?: AbortSignal
    ): Promise<Record<ReactionType, number>> => {
      const response = await this.axiosInstance.get<
        ApiResponse<Record<ReactionType, number>>
      >(`/households/${householdId}/messages/reaction-analytics`, { signal });
      return this.extractData(response);
    },

    /**
     * Get reactions by type
     */
    getReactionsByType: async (
      householdId: string,
      type: ReactionType,
      signal?: AbortSignal
    ): Promise<ReactionWithUser[]> => {
      const response = await this.axiosInstance.get<
        ApiResponse<ReactionWithUser[]>
      >(`/households/${householdId}/messages/reactions-by-type`, {
        params: { type },
        signal,
      });
      return this.extractData(response);
    },

    /**
     * Get polls in thread
     */
    getPollsInThread: async (
      householdId: string,
      threadId: string,
      messageId: string,
      signal?: AbortSignal
    ): Promise<PollWithDetails[]> => {
      const response = await this.axiosInstance.get<
        ApiResponse<PollWithDetails[]>
      >(
        `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls`,
        { signal }
      );
      return this.extractData(response);
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
    ): Promise<any> => {
      const response = await this.axiosInstance.get<ApiResponse<any>>(
        `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}/analytics`,
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Remove poll vote
     */
    removePollVote: async (
      householdId: string,
      threadId: string,
      messageId: string,
      pollId: string,
      voteId: string,
      signal?: AbortSignal
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}/vote`,
        {
          data: { voteId },
          signal,
        }
      );
    },
  };
}
