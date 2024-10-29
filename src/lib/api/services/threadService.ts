import { ApiResponse } from "@shared/interfaces";
import {
  Thread,
  UpdateThreadDTO,
  Message,
  CreateMessageDTO,
  UpdateMessageDTO,
  Attachment,
} from "@shared/types";
import { BaseApiClient } from "../baseClient";

export class ThreadService extends BaseApiClient {
  /**
   * Get all threads for a household
   */
  public async getThreads(
    householdId: string,
    signal?: AbortSignal
  ): Promise<Thread[]> {
    const response = await this.axiosInstance.get<ApiResponse<Thread[]>>(
      `/households/${householdId}/threads`,
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Create a new thread
   */
  public async createThread(
    householdId: string,
    threadData: UpdateThreadDTO,
    signal?: AbortSignal
  ): Promise<Thread> {
    const response = await this.axiosInstance.post<ApiResponse<Thread>>(
      `/households/${householdId}/threads`,
      threadData,
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Get details of a specific thread
   */
  public async getThreadDetails(
    householdId: string,
    threadId: string,
    signal?: AbortSignal
  ): Promise<Thread> {
    const response = await this.axiosInstance.get<ApiResponse<Thread>>(
      `/households/${householdId}/threads/${threadId}`,
      { signal }
    );
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
  ): Promise<Thread> {
    const response = await this.axiosInstance.post<ApiResponse<Thread>>(
      `/households/${householdId}/threads/${threadId}/invite`,
      { userIds },
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
      signal?: AbortSignal
    ): Promise<Message[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Message[]>>(
        `/households/${householdId}/threads/${threadId}/messages`,
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Create a new message
     */
    createMessage: async (
      householdId: string,
      threadId: string,
      messageData: CreateMessageDTO,
      signal?: AbortSignal
    ): Promise<Message> => {
      const response = await this.axiosInstance.post<ApiResponse<Message>>(
        `/households/${householdId}/threads/${threadId}/messages`,
        messageData,
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Get details of a specific message
     */
    getMessageDetails: async (
      householdId: string,
      threadId: string,
      messageId: string,
      signal?: AbortSignal
    ): Promise<Message> => {
      const response = await this.axiosInstance.get<ApiResponse<Message>>(
        `/households/${householdId}/threads/${threadId}/messages/${messageId}`,
        { signal }
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
    ): Promise<Message> => {
      const response = await this.axiosInstance.patch<ApiResponse<Message>>(
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
     * Attachment management for messages
     */
    attachments: {
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
  };
}
