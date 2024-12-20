import {
  handleApiRequest,
  ApiRequestOptions,
  buildRequestConfig,
} from "../utils/apiUtils";
import { axiosInstance } from "../axiosInstance";
import type {
  ThreadWithDetails,
  MessageWithDetails,
  CreateMessageDTO,
  UpdateMessageDTO,
  CreateThreadDTO,
  UpdateThreadDTO,
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
  Attachment as MessageAttachment,
  HouseholdMember,
} from "@shared/types";
import type { PaginationOptions } from "@shared/interfaces";
import type { ApiResponse } from "@shared/interfaces/apiResponse";
import { ReactionType } from "@shared/enums";

interface ThreadAnalytics {
  messageCount: number;
  participantCount: number;
  lastActivityAt: Date;
  reactionStats: Record<ReactionType, number>;
}

export interface PollAnalytics {
  totalVotes: number;
  optionBreakdown: {
    optionId: string;
    votes: number;
    percentage: number;
  }[];
  stats: Record<string, number>;
}

export const threadKeys = {
  all: ["threads"] as const,
  lists: () => [...threadKeys.all, "list"] as const,
  list: (householdId: string, params?: PaginationOptions) =>
    [...threadKeys.lists(), householdId, params] as const,
  details: () => [...threadKeys.all, "detail"] as const,
  detail: (householdId: string, threadId: string) =>
    [...threadKeys.details(), householdId, threadId] as const,
  messages: {
    list: (householdId: string, threadId: string) =>
      [...threadKeys.detail(householdId, threadId), "messages"] as const,
    detail: (householdId: string, threadId: string, messageId: string) =>
      [
        ...threadKeys.detail(householdId, threadId),
        "messages",
        messageId,
      ] as const,
    readStatus: (householdId: string, threadId: string, messageId: string) =>
      [
        ...threadKeys.messages.detail(householdId, threadId, messageId),
        "readStatus",
      ] as const,
    reactions: (householdId: string, threadId: string, messageId: string) =>
      [
        ...threadKeys.messages.detail(householdId, threadId, messageId),
        "reactions",
      ] as const,
    mentions: (householdId: string, threadId: string, messageId: string) =>
      [
        ...threadKeys.messages.detail(householdId, threadId, messageId),
        "mentions",
      ] as const,
    attachments: (householdId: string, threadId: string, messageId: string) =>
      [
        ...threadKeys.messages.detail(householdId, threadId, messageId),
        "attachments",
      ] as const,
    polls: {
      list: (householdId: string, threadId: string, messageId: string) =>
        [
          ...threadKeys.messages.detail(householdId, threadId, messageId),
          "polls",
        ] as const,
      detail: (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string
      ) =>
        [
          ...threadKeys.messages.detail(householdId, threadId, messageId),
          "polls",
          pollId,
        ] as const,
      analytics: (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string
      ) =>
        [
          ...threadKeys.messages.detail(householdId, threadId, messageId),
          "polls",
          pollId,
          "analytics",
        ] as const,
    },
  },
  global: {
    reactions: (householdId: string) =>
      [...threadKeys.all, householdId, "reactions"] as const,
    mentions: (householdId: string) =>
      [...threadKeys.all, householdId, "mentions"] as const,
  },
  analytics: () => [...threadKeys.all, "analytics"] as const,
  threadAnalytics: (householdId: string, threadId: string) =>
    [...threadKeys.analytics(), householdId, threadId] as const,

  participants: () => [...threadKeys.all, "participants"] as const,
  threadParticipants: (householdId: string, threadId: string) =>
    [...threadKeys.participants(), householdId, threadId] as const,
} as const;

export const threadApi = {
  threads: {
    list: async (
      householdId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<ThreadWithDetails[]>> => {
      return handleApiRequest<ThreadWithDetails[]>(
        () =>
          axiosInstance.get(
            `/households/${householdId}/threads`,
            buildRequestConfig({
              ...config,
              params: {
                ...config?.params,
                sort: "lastMessageAt:desc",
              },
            })
          ),
        {
          operation: "List Threads",
          metadata: { householdId, params: config?.params },
        }
      );
    },

    get: async (
      householdId: string,
      threadId: string,
      config?: ApiRequestOptions
    ): Promise<ThreadWithDetails> => {
      const result = await handleApiRequest<ThreadWithDetails>(
        () =>
          axiosInstance.get(
            `/households/${householdId}/threads/${threadId}`,
            buildRequestConfig(config)
          ),
        {
          operation: "Get Thread",
          metadata: { householdId, threadId },
        }
      );
      return result.data;
    },

    create: async (
      householdId: string,
      data: Omit<CreateThreadDTO, "householdId">,
      config?: ApiRequestOptions
    ): Promise<ThreadWithDetails> => {
      const result = await handleApiRequest<ThreadWithDetails>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/threads`,
            { ...data, householdId },
            buildRequestConfig(config)
          ),
        {
          operation: "Create Thread",
          metadata: { householdId, title: data.title },
        }
      );
      return result.data;
    },

    update: async (
      householdId: string,
      threadId: string,
      data: UpdateThreadDTO,
      config?: ApiRequestOptions
    ): Promise<ThreadWithDetails> => {
      const result = await handleApiRequest<ThreadWithDetails>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}/threads/${threadId}`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Update Thread",
          metadata: {
            householdId,
            threadId,
            updatedFields: Object.keys(data),
          },
        }
      );
      return result.data;
    },

    delete: async (
      householdId: string,
      threadId: string,
      config?: ApiRequestOptions
    ): Promise<void> => {
      await handleApiRequest<void>(
        () =>
          axiosInstance.delete(
            `/households/${householdId}/threads/${threadId}`,
            buildRequestConfig(config)
          ),
        {
          operation: "Delete Thread",
          metadata: { householdId, threadId },
        }
      );
    },

    invite: async (
      householdId: string,
      threadId: string,
      userIds: string[],
      config?: ApiRequestOptions
    ): Promise<ThreadWithDetails> => {
      const result = await handleApiRequest<ThreadWithDetails>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/threads/${threadId}/invite`,
            { userIds },
            buildRequestConfig(config)
          ),
        {
          operation: "Invite Users to Thread",
          metadata: {
            householdId,
            threadId,
            userCount: userIds.length,
          },
        }
      );
      return result.data;
    },

    getParticipants: async (
      householdId: string,
      threadId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<HouseholdMember[]>> => {
      return handleApiRequest<HouseholdMember[]>(
        () =>
          axiosInstance.get(
            `/households/${householdId}/threads/${threadId}/participants`,
            buildRequestConfig(config)
          ),
        {
          operation: "Get Thread Participants",
          metadata: { householdId, threadId },
        }
      );
    },

    updateParticipants: async (
      householdId: string,
      threadId: string,
      data: { add?: string[]; remove?: string[] },
      config?: ApiRequestOptions
    ): Promise<ApiResponse<ThreadWithDetails>> => {
      return handleApiRequest<ThreadWithDetails>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}/threads/${threadId}/participants`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Update Thread Participants",
          metadata: { householdId, threadId, participantChanges: data },
        }
      );
    },
  },

  messages: {
    list: async (
      householdId: string,
      threadId: string,
      config?: ApiRequestOptions
    ): Promise<ApiResponse<MessageWithDetails[]>> => {
      return handleApiRequest<MessageWithDetails[]>(
        () =>
          axiosInstance.get(
            `/households/${householdId}/threads/${threadId}/messages`,
            buildRequestConfig(config)
          ),
        {
          operation: "List Messages",
          metadata: {
            householdId,
            threadId,
            params: config?.params,
          },
        }
      );
    },

    create: async (
      householdId: string,
      threadId: string,
      data: CreateMessageDTO,
      config?: ApiRequestOptions
    ): Promise<MessageWithDetails> => {
      const result = await handleApiRequest<MessageWithDetails>(
        () =>
          axiosInstance.post(
            `/households/${householdId}/threads/${threadId}/messages`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Create Message",
          metadata: {
            householdId,
            threadId,
            hasAttachments: !!data.attachments?.length,
          },
        }
      );
      return result.data;
    },

    update: async (
      householdId: string,
      threadId: string,
      messageId: string,
      data: UpdateMessageDTO,
      config?: ApiRequestOptions
    ): Promise<MessageWithDetails> => {
      const result = await handleApiRequest<MessageWithDetails>(
        () =>
          axiosInstance.patch(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}`,
            data,
            buildRequestConfig(config)
          ),
        {
          operation: "Update Message",
          metadata: {
            householdId,
            threadId,
            messageId,
            updatedFields: Object.keys(data),
          },
        }
      );
      return result.data;
    },

    delete: async (
      householdId: string,
      threadId: string,
      messageId: string,
      config?: ApiRequestOptions
    ): Promise<void> => {
      await handleApiRequest<void>(
        () =>
          axiosInstance.delete(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}`,
            buildRequestConfig(config)
          ),
        {
          operation: "Delete Message",
          metadata: { householdId, threadId, messageId },
        }
      );
    },

    reactions: {
      addReaction: async (
        householdId: string,
        threadId: string,
        messageId: string,
        data: CreateReactionDTO,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<ReactionWithUser>> => {
        return handleApiRequest<ReactionWithUser>(
          () =>
            axiosInstance.post(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions`,
              data,
              buildRequestConfig(config)
            ),
          {
            operation: "Add Reaction",
            metadata: {
              householdId,
              threadId,
              messageId,
              type: data.type,
            },
          }
        );
      },

      removeReaction: async (
        householdId: string,
        threadId: string,
        messageId: string,
        reactionId: string,
        config?: ApiRequestOptions
      ): Promise<void> => {
        await handleApiRequest<void>(
          () =>
            axiosInstance.delete(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions/${reactionId}`,
              buildRequestConfig(config)
            ),
          {
            operation: "Remove Reaction",
            metadata: {
              householdId,
              threadId,
              messageId,
              reactionId,
            },
          }
        );
      },

      getMessageReactions: async (
        householdId: string,
        threadId: string,
        messageId: string,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<ReactionWithUser[]>> => {
        return handleApiRequest<ReactionWithUser[]>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get Message Reactions",
            metadata: {
              householdId,
              threadId,
              messageId,
            },
          }
        );
      },

      getReactionAnalytics: async (
        householdId: string,
        threadId: string,
        messageId: string,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<Record<ReactionType, number>>> => {
        return handleApiRequest<Record<ReactionType, number>>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/reactions/analytics`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get Reaction Analytics",
            metadata: {
              householdId,
              threadId,
              messageId,
            },
          }
        );
      },

      getGlobalAnalytics: async (
        householdId: string,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<Record<ReactionType, number>>> => {
        return handleApiRequest<Record<ReactionType, number>>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/messages/reaction-analytics`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get Global Reaction Analytics",
            metadata: { householdId },
          }
        );
      },

      getByType: async (
        householdId: string,
        type: ReactionType,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<ReactionWithUser[]>> => {
        return handleApiRequest<ReactionWithUser[]>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/messages/reactions-by-type`,
              buildRequestConfig({ ...config, params: { type } })
            ),
          {
            operation: "Get Reactions By Type",
            metadata: { householdId, type },
          }
        );
      },
    },

    mentions: {
      createMention: async (
        householdId: string,
        threadId: string,
        messageId: string,
        data: CreateMentionDTO,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<MentionWithUser>> => {
        return handleApiRequest<MentionWithUser>(
          () =>
            axiosInstance.post(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/mentions`,
              data,
              buildRequestConfig(config)
            ),
          {
            operation: "Create Mention",
            metadata: {
              householdId,
              threadId,
              messageId,
              userId: data.userId,
            },
          }
        );
      },

      removeMention: async (
        householdId: string,
        threadId: string,
        messageId: string,
        mentionId: string,
        config?: ApiRequestOptions
      ): Promise<void> => {
        await handleApiRequest<void>(
          () =>
            axiosInstance.delete(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/mentions/${mentionId}`,
              buildRequestConfig(config)
            ),
          {
            operation: "Remove Mention",
            metadata: {
              householdId,
              threadId,
              messageId,
              mentionId,
            },
          }
        );
      },

      getUnreadMentionsCount: async (
        householdId: string,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<number>> => {
        return handleApiRequest<number>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/messages/unread-mentions-count`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get Unread Mentions Count",
            metadata: {
              householdId,
            },
          }
        );
      },

      getUserMentions: async (
        householdId: string,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<MentionWithUser[]>> => {
        return handleApiRequest<MentionWithUser[]>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/messages/mentions`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get User Mentions",
            metadata: { householdId },
          }
        );
      },

      getMessageMentions: async (
        householdId: string,
        threadId: string,
        messageId: string,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<MentionWithUser[]>> => {
        return handleApiRequest<MentionWithUser[]>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/mentions`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get Message Mentions",
            metadata: { householdId, threadId, messageId },
          }
        );
      },
    },

    polls: {
      list: async (
        householdId: string,
        threadId: string,
        messageId: string,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<PollWithDetails[]>> => {
        return handleApiRequest<PollWithDetails[]>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls`,
              buildRequestConfig(config)
            ),
          {
            operation: "List Polls",
            metadata: { householdId, threadId, messageId },
          }
        );
      },

      get: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        config?: ApiRequestOptions
      ): Promise<PollWithDetails> => {
        const result = await handleApiRequest<PollWithDetails>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get Poll",
            metadata: { householdId, threadId, messageId, pollId },
          }
        );
        return result.data;
      },

      create: async (
        householdId: string,
        threadId: string,
        messageId: string,
        data: CreatePollDTO,
        config?: ApiRequestOptions
      ): Promise<PollWithDetails> => {
        const result = await handleApiRequest<PollWithDetails>(
          () =>
            axiosInstance.post(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls`,
              data,
              buildRequestConfig(config)
            ),
          {
            operation: "Create Poll",
            metadata: { householdId, threadId, messageId },
          }
        );
        return result.data;
      },

      update: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        data: UpdatePollDTO,
        config?: ApiRequestOptions
      ): Promise<PollWithDetails> => {
        const result = await handleApiRequest<PollWithDetails>(
          () =>
            axiosInstance.patch(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}`,
              data,
              buildRequestConfig(config)
            ),
          {
            operation: "Update Poll",
            metadata: { householdId, threadId, messageId, pollId },
          }
        );
        return result.data;
      },

      delete: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        config?: ApiRequestOptions
      ): Promise<void> => {
        await handleApiRequest<void>(
          () =>
            axiosInstance.delete(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}`,
              buildRequestConfig(config)
            ),
          {
            operation: "Delete Poll",
            metadata: { householdId, threadId, messageId, pollId },
          }
        );
      },

      vote: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        data: CreatePollVoteDTO,
        config?: ApiRequestOptions
      ): Promise<PollVoteWithUser> => {
        const result = await handleApiRequest<PollVoteWithUser>(
          () =>
            axiosInstance.post(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}/vote`,
              data,
              buildRequestConfig(config)
            ),
          {
            operation: "Vote Poll",
            metadata: { householdId, threadId, messageId, pollId },
          }
        );
        return result.data;
      },

      removeVote: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        voteId: string,
        config?: ApiRequestOptions
      ): Promise<void> => {
        await handleApiRequest<void>(
          () =>
            axiosInstance.delete(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}/vote/${voteId}`,
              buildRequestConfig(config)
            ),
          {
            operation: "Remove Poll Vote",
            metadata: { householdId, threadId, messageId, pollId, voteId },
          }
        );
      },

      getAnalytics: async (
        householdId: string,
        threadId: string,
        messageId: string,
        pollId: string,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<PollAnalytics>> => {
        return handleApiRequest<PollAnalytics>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/polls/${pollId}/analytics`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get Poll Analytics",
            metadata: { householdId, threadId, messageId, pollId },
          }
        );
      },
    },

    attachments: {
      list: async (
        householdId: string,
        threadId: string,
        messageId: string,
        config?: ApiRequestOptions
      ): Promise<ApiResponse<MessageAttachment[]>> => {
        return handleApiRequest<MessageAttachment[]>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments`,
              buildRequestConfig(config)
            ),
          {
            operation: "List Attachments",
            metadata: { householdId, threadId, messageId },
          }
        );
      },

      get: async (
        householdId: string,
        threadId: string,
        messageId: string,
        attachmentId: string,
        config?: ApiRequestOptions
      ): Promise<MessageAttachment> => {
        const result = await handleApiRequest<MessageAttachment>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments/${attachmentId}`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get Attachment",
            metadata: { householdId, threadId, messageId, attachmentId },
          }
        );
        return result.data;
      },

      create: async (
        householdId: string,
        threadId: string,
        messageId: string,
        data: FormData,
        config?: ApiRequestOptions
      ): Promise<MessageAttachment> => {
        const result = await handleApiRequest<MessageAttachment>(
          () =>
            axiosInstance.post(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments`,
              data,
              buildRequestConfig(config)
            ),
          {
            operation: "Create Attachment",
            metadata: { householdId, threadId, messageId },
          }
        );
        return result.data;
      },

      delete: async (
        householdId: string,
        threadId: string,
        messageId: string,
        attachmentId: string,
        config?: ApiRequestOptions
      ): Promise<void> => {
        await handleApiRequest<void>(
          () =>
            axiosInstance.delete(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments/${attachmentId}`,
              buildRequestConfig(config)
            ),
          {
            operation: "Delete Attachment",
            metadata: { householdId, threadId, messageId, attachmentId },
          }
        );
      },
    },

    readStatus: {
      mark: async (
        householdId: string,
        threadId: string,
        messageId: string,
        config?: ApiRequestOptions
      ): Promise<MessageReadStatus> => {
        const result = await handleApiRequest<MessageReadStatus>(
          () =>
            axiosInstance.post(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/read`,
              {},
              buildRequestConfig(config)
            ),
          {
            operation: "Mark Message as Read",
            metadata: { householdId, threadId, messageId },
          }
        );
        return result.data;
      },

      get: async (
        householdId: string,
        threadId: string,
        messageId: string,
        config?: ApiRequestOptions
      ): Promise<MessageReadStatus> => {
        const result = await handleApiRequest<MessageReadStatus>(
          () =>
            axiosInstance.get(
              `/households/${householdId}/threads/${threadId}/messages/${messageId}/read-status`,
              buildRequestConfig(config)
            ),
          {
            operation: "Get Message Read Status",
            metadata: { householdId, threadId, messageId },
          }
        );
        return result.data;
      },
    },
  },
} as const;

export type ThreadApi = typeof threadApi;
