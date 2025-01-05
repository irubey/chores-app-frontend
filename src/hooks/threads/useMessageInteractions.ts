// frontend/src/hooks/threads/useMessageInteractions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { threadApi, threadKeys } from "@/lib/api/services/threadService";
import {
  MessageWithDetails,
  ThreadWithDetails,
  CreateMessageDTO,
  UpdateMessageDTO,
  Attachment,
  MentionWithUser,
  PollWithDetails,
  User,
  HouseholdMemberWithUser,
  CreateReactionDTO,
  ReactionWithUser,
  CreatePollDTO,
} from "@shared/types";
import { PollStatus, PollType } from "@shared/enums/poll";
import { logger } from "@/lib/api/logger";
import { getThreadById, getMessageById } from "./useThreads";
import { useAuth } from "@/contexts/UserContext";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";
import { useUser } from "../users/useUser";

// Types
interface MessageOptions {
  readonly householdId: string;
  readonly threadId: string;
  readonly messageId?: string;
}

/**
 * Hook for message mutations (create/update/delete) using thread data
 */
export const useMessageInteractions = ({
  householdId,
  threadId,
  messageId,
}: MessageOptions) => {
  const queryClient = useQueryClient();
  const { status, isLoading: isAuthLoading } = useAuth();
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  // Return early if not authenticated or still loading auth
  if (isAuthLoading) {
    return {
      createMessage: async () => {},
      updateMessage: async () => {},
      deleteMessage: async () => {},
      addReaction: async () => {},
      removeReaction: async () => {},
      markAsRead: async () => {},
      createPoll: async () => {},
      addAttachment: async () => {},
      removeAttachment: async () => {},
      getReadStatus: async () => {},
      isPending: false,
    };
  }

  if (status !== "authenticated") {
    return {
      createMessage: async () => {},
      updateMessage: async () => {},
      deleteMessage: async () => {},
      addReaction: async () => {},
      removeReaction: async () => {},
      markAsRead: async () => {},
      createPoll: async () => {},
      addAttachment: async () => {},
      removeAttachment: async () => {},
      getReadStatus: async () => {},
      isPending: false,
    };
  }

  const createMessage = useMutation({
    mutationFn: async (data: CreateMessageDTO) => {
      if (!currentUser) {
        throw new Error("User must be logged in to create messages");
      }
      if (currentUser.activeHouseholdId !== householdId) {
        throw new Error("User must be in the household to create messages");
      }

      try {
        const result = await threadApi.messages.create(
          householdId,
          threadId,
          data
        );
        logger.info("Message created", {
          threadId,
          householdId,
          userId: currentUser.id,
          hasAttachments: data.attachments?.length > 0,
          hasMentions: data.mentions?.length > 0,
          hasPoll: !!data.poll,
        });
        return result;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.type === ApiErrorType.UNAUTHORIZED
        ) {
          logger.error("Unauthorized to create message", {
            threadId,
            householdId,
            userId: currentUser.id,
          });
        } else {
          logger.error("Failed to create message", {
            threadId,
            householdId,
            userId: currentUser.id,
            error,
          });
        }
        throw error;
      }
    },
    onMutate: async (data) => {
      if (!currentUser) return;

      await queryClient.cancelQueries({
        queryKey: threadKeys.list(householdId),
      });

      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );
      const thread = getThreadById(threads, threadId);

      if (threads && thread) {
        // Create optimistic attachments if any
        const optimisticAttachments: Attachment[] | undefined =
          data.attachments?.map((attachment, index) => ({
            id: `temp-attachment-${Date.now()}-${index}`,
            messageId: `temp-${Date.now()}`,
            url: attachment.url,
            fileType: attachment.fileType,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

        // Create optimistic mentions if any
        const optimisticMentions: MentionWithUser[] | undefined =
          data.mentions?.map((userId, index) => {
            const mentionedMember = thread.participants.find(
              (m) => m.userId === userId
            ) as HouseholdMemberWithUser;
            const user: User = mentionedMember?.user
              ? {
                  id: mentionedMember.user.id,
                  name: mentionedMember.user.name || "Unknown",
                  email: mentionedMember.user.email || "",
                  profileImageURL: mentionedMember.user.profileImageURL || "",
                  activeHouseholdId: mentionedMember.user.activeHouseholdId,
                  createdAt: mentionedMember.user.createdAt || new Date(),
                  updatedAt: mentionedMember.user.updatedAt || new Date(),
                }
              : {
                  id: userId,
                  name: "Loading...",
                  email: "",
                  profileImageURL: "",
                  activeHouseholdId: householdId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };

            return {
              id: `temp-mention-${Date.now()}-${index}`,
              messageId: `temp-${Date.now()}`,
              userId,
              mentionedAt: new Date(),
              user,
            };
          });

        // Create optimistic poll if any
        const optimisticPoll: PollWithDetails | undefined = data.poll
          ? {
              id: `temp-poll-${Date.now()}`,
              messageId: `temp-${Date.now()}`,
              question: data.poll.question,
              pollType: data.poll.pollType as PollType,
              maxChoices: data.poll.maxChoices,
              maxRank: data.poll.maxRank,
              endDate: data.poll.endDate,
              eventId: data.poll.eventId,
              status: PollStatus.OPEN,
              createdAt: new Date(),
              updatedAt: new Date(),
              options: data.poll.options.map((option, index) => ({
                id: `temp-poll-option-${Date.now()}-${index}`,
                pollId: `temp-poll-${Date.now()}`,
                text: option.text,
                order: option.order,
                startTime: option.startTime,
                endTime: option.endTime,
                createdAt: new Date(),
                updatedAt: new Date(),
                votes: [],
                voteCount: 0,
              })),
            }
          : undefined;

        // Create optimistic message
        const optimisticMessage: MessageWithDetails = {
          id: `temp-${Date.now()}`,
          threadId,
          authorId: currentUser.id,
          content: data.content,
          createdAt: new Date(),
          updatedAt: new Date(),
          thread,
          author: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            profileImageURL: currentUser.profileImageURL,
            activeHouseholdId: currentUser.activeHouseholdId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          attachments: optimisticAttachments,
          mentions: optimisticMentions,
          poll: optimisticPoll,
          reactions: [],
          reads: [],
        };

        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: [...t.messages, optimisticMessage],
                }
              : t
          )
        );
      }

      return { previousThreads: threads };
    },
    onError: (_, __, context) => {
      if (context?.previousThreads) {
        queryClient.setQueryData(
          threadKeys.list(householdId),
          context.previousThreads
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.list(householdId),
      });
    },
  });

  const updateMessage = useMutation({
    mutationFn: async (data: UpdateMessageDTO) => {
      if (!messageId)
        throw new Error("messageId is required for updating messages");
      if (!currentUser)
        throw new Error("User must be logged in to update messages");
      if (currentUser.activeHouseholdId !== householdId) {
        throw new Error("User must be in the household to update messages");
      }

      try {
        const result = await threadApi.messages.update(
          householdId,
          threadId,
          messageId,
          data
        );
        logger.info("Message updated", {
          messageId,
          threadId,
          householdId,
          userId: currentUser.id,
          updatedFields: Object.keys(data),
        });
        return result;
      } catch (error) {
        logger.error("Failed to update message", {
          messageId,
          threadId,
          householdId,
          userId: currentUser.id,
          error,
        });
        throw error;
      }
    },
    onMutate: async (data) => {
      if (!messageId || !currentUser) return;

      await queryClient.cancelQueries({
        queryKey: threadKeys.list(householdId),
      });

      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );
      const thread = getThreadById(threads, threadId);
      const message = thread ? getMessageById(thread, messageId) : undefined;

      if (threads && message) {
        const updatedMessage: MessageWithDetails = {
          ...message,
          content: data.content || message.content,
          updatedAt: new Date(),
        };

        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId ? updatedMessage : m
                  ),
                }
              : t
          )
        );
      }

      return { previousMessage: message };
    },
    onError: (_, __, context) => {
      if (context?.previousMessage) {
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
                      m.id === messageId ? context.previousMessage : m
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
      queryClient.invalidateQueries({
        queryKey: threadKeys.detail(householdId, threadId),
      });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async () => {
      if (!messageId)
        throw new Error("messageId is required for deleting messages");
      if (!currentUser)
        throw new Error("User must be logged in to delete messages");
      if (currentUser.activeHouseholdId !== householdId) {
        throw new Error("User must be in the household to delete messages");
      }

      try {
        await threadApi.messages.delete(householdId, threadId, messageId);
        logger.info("Message deleted", {
          messageId,
          threadId,
          householdId,
          userId: currentUser.id,
        });
      } catch (error) {
        logger.error("Failed to delete message", {
          messageId,
          threadId,
          householdId,
          userId: currentUser.id,
          error,
        });
        throw error;
      }
    },
    onMutate: async () => {
      if (!messageId || !currentUser) return;

      // Cancel any outgoing refetches
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: threadKeys.list(householdId),
        }),
        queryClient.cancelQueries({
          queryKey: threadKeys.detail(householdId, threadId),
        }),
      ]);

      // Snapshot the previous value
      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );
      const thread = getThreadById(threads, threadId);
      const message = thread ? getMessageById(thread, messageId) : undefined;

      // Optimistically update the cache
      if (threads) {
        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.filter((m) => m.id !== messageId),
                }
              : t
          )
        );
      }

      return { previousMessage: message, previousThreads: threads };
    },
    onError: (_, __, context) => {
      if (context?.previousThreads) {
        queryClient.setQueryData(
          threadKeys.list(householdId),
          context.previousThreads
        );
      }
    },
    onSettled: async () => {
      // Invalidate and refetch
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: threadKeys.list(householdId),
        }),
        queryClient.invalidateQueries({
          queryKey: threadKeys.detail(householdId, threadId),
        }),
      ]);
    },
  });

  const addReaction = useMutation({
    mutationFn: async (data: CreateReactionDTO) => {
      if (!messageId)
        throw new Error("messageId is required for adding reactions");
      if (!currentUser)
        throw new Error("User must be logged in to add reactions");
      if (currentUser.activeHouseholdId !== householdId) {
        throw new Error("User must be in the household to add reactions");
      }

      try {
        const result = await threadApi.messages.reactions.addReaction(
          householdId,
          threadId,
          messageId,
          data
        );
        logger.info("Reaction added", {
          messageId,
          threadId,
          householdId,
          userId: currentUser.id,
          emoji: data.emoji,
        });
        return result.data;
      } catch (error) {
        // Check if error is due to duplicate reaction
        if (
          error instanceof Error &&
          error.message.includes("already reacted with this reaction type")
        ) {
          logger.warn("Attempted to add duplicate reaction", {
            messageId,
            threadId,
            householdId,
            userId: currentUser.id,
            type: data.type,
          });
          return;
        }

        logger.error("Failed to add reaction", {
          messageId,
          threadId,
          householdId,
          userId: currentUser.id,
          error,
        });
        throw error;
      }
    },
    onMutate: async (data) => {
      if (!currentUser) return;

      // Cancel any outgoing refetches
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: threadKeys.list(householdId),
        }),
        queryClient.cancelQueries({
          queryKey: threadKeys.detail(householdId, threadId),
        }),
      ]);

      // Snapshot the previous value
      const previousThreads = queryClient.getQueryData<
        readonly ThreadWithDetails[]
      >(threadKeys.list(householdId));

      // Create optimistic reaction
      const optimisticReaction = {
        id: `temp-${Date.now()}`,
        messageId,
        userId: currentUser.id,
        emoji: data.emoji,
        type: data.type,
        createdAt: new Date(),
        user: currentUser,
      };

      // Optimistically update threads
      if (previousThreads) {
        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          previousThreads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId
                      ? {
                          ...m,
                          reactions: [...m.reactions, optimisticReaction],
                        }
                      : m
                  ),
                }
              : t
          )
        );
      }

      return { previousThreads };
    },
    onError: (_, __, context) => {
      if (context?.previousThreads) {
        queryClient.setQueryData(
          threadKeys.list(householdId),
          context.previousThreads
        );
      }
    },
    onSettled: async () => {
      // Invalidate and refetch both queries immediately
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: threadKeys.list(householdId),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: threadKeys.detail(householdId, threadId),
          refetchType: "all",
        }),
      ]);
    },
  });

  const removeReaction = useMutation({
    mutationFn: async (reactionId: string) => {
      if (!messageId)
        throw new Error("messageId is required for removing reactions");
      if (!currentUser)
        throw new Error("User must be logged in to remove reactions");
      if (currentUser.activeHouseholdId !== householdId) {
        throw new Error("User must be in the household to remove reactions");
      }

      try {
        await threadApi.messages.reactions.removeReaction(
          householdId,
          threadId,
          messageId,
          reactionId
        );
        logger.info("Reaction removed", {
          messageId,
          threadId,
          householdId,
          userId: currentUser.id,
          reactionId,
        });
      } catch (error) {
        logger.error("Failed to remove reaction", {
          messageId,
          threadId,
          householdId,
          userId: currentUser.id,
          reactionId,
          error,
        });
        throw error;
      }
    },
    onSettled: async () => {
      // Invalidate and refetch both queries immediately
      await queryClient.invalidateQueries({
        queryKey: threadKeys.list(householdId),
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: threadKeys.detail(householdId, threadId),
        refetchType: "all",
      });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!messageId)
        throw new Error("messageId is required for marking as read");
      const result = await threadApi.messages.readStatus.mark(
        householdId,
        threadId,
        messageId
      );
      return result;
    },
    onMutate: async () => {
      // Optimistic update for read status
      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );
      if (threads && currentUser) {
        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId
                      ? {
                          ...m,
                          reads: [
                            ...m.reads,
                            {
                              id: `temp-${Date.now()}`,
                              messageId,
                              userId: currentUser.id,
                              readAt: new Date(),
                              user: currentUser,
                            },
                          ],
                        }
                      : m
                  ),
                }
              : t
          )
        );
      }
    },
  });

  const createPoll = useMutation({
    mutationFn: async (data: CreatePollDTO) => {
      if (!messageId)
        throw new Error("messageId is required for creating polls");
      const result = await threadApi.messages.polls.create(
        householdId,
        threadId,
        messageId,
        data
      );
      return result;
    },
    onMutate: async (data) => {
      // Optimistic update for poll creation
      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );
      if (threads && currentUser) {
        const optimisticPoll: PollWithDetails = {
          id: `temp-${Date.now()}`,
          messageId,
          question: data.question,
          pollType: data.pollType,
          maxChoices: data.maxChoices,
          maxRank: data.maxRank,
          endDate: data.endDate,
          eventId: data.eventId,
          status: PollStatus.OPEN,
          createdAt: new Date(),
          updatedAt: new Date(),
          options: data.options.map((option, index) => ({
            id: `temp-option-${Date.now()}-${index}`,
            pollId: `temp-${Date.now()}`,
            text: option.text,
            order: option.order,
            startTime: option.startTime,
            endTime: option.endTime,
            createdAt: new Date(),
            updatedAt: new Date(),
            votes: [],
            voteCount: 0,
          })),
        };

        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId ? { ...m, poll: optimisticPoll } : m
                  ),
                }
              : t
          )
        );
      }
    },
  });

  const addAttachment = useMutation({
    mutationFn: async (data: FormData) => {
      if (!messageId)
        throw new Error("messageId is required for adding attachments");
      const result = await threadApi.messages.attachments.create(
        householdId,
        threadId,
        messageId,
        data
      );
      return result;
    },
    onMutate: async (data) => {
      // Optimistic update for attachment
      const threads = queryClient.getQueryData<readonly ThreadWithDetails[]>(
        threadKeys.list(householdId)
      );
      if (threads) {
        const optimisticAttachment: Attachment = {
          id: `temp-${Date.now()}`,
          messageId,
          url: URL.createObjectURL(data.get("file") as File),
          fileType: (data.get("file") as File).type,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData<readonly ThreadWithDetails[]>(
          threadKeys.list(householdId),
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId
                      ? {
                          ...m,
                          attachments: [
                            ...(m.attachments || []),
                            optimisticAttachment,
                          ],
                        }
                      : m
                  ),
                }
              : t
          )
        );
      }
    },
  });

  const removeAttachment = useMutation({
    mutationFn: async (attachmentId: string) => {
      if (!messageId)
        throw new Error("messageId is required for removing attachments");
      await threadApi.messages.attachments.delete(
        householdId,
        threadId,
        messageId,
        attachmentId
      );
    },
    onMutate: async (attachmentId) => {
      // Optimistic update for attachment removal
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
                      ? {
                          ...m,
                          attachments:
                            m.attachments?.filter(
                              (a) => a.id !== attachmentId
                            ) || [],
                        }
                      : m
                  ),
                }
              : t
          )
        );
      }
    },
  });

  const getReadStatus = useMutation({
    mutationFn: async () => {
      if (!messageId)
        throw new Error("messageId is required for getting read status");
      const result = await threadApi.messages.readStatus.get(
        householdId,
        threadId,
        messageId
      );
      return result;
    },
  });

  return {
    createMessage: createMessage.mutate,
    updateMessage: updateMessage.mutate,
    deleteMessage: deleteMessage.mutate,
    addReaction: addReaction.mutate,
    removeReaction: removeReaction.mutate,
    markAsRead: markAsRead.mutate,
    createPoll: createPoll.mutate,
    addAttachment: addAttachment.mutate,
    removeAttachment: removeAttachment.mutate,
    getReadStatus: getReadStatus.mutate,
    isPending:
      createMessage.isPending ||
      updateMessage.isPending ||
      deleteMessage.isPending ||
      addReaction.isPending ||
      removeReaction.isPending ||
      markAsRead.isPending ||
      createPoll.isPending ||
      addAttachment.isPending ||
      removeAttachment.isPending ||
      getReadStatus.isPending,
  };
};
