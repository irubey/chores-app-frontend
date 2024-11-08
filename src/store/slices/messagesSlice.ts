import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "@api/apiClient";
import {
  MessageWithDetails,
  CreateMessageDTO,
  UpdateMessageDTO,
  Attachment,
  ReactionWithUser,
  CreateReactionDTO,
  PollWithDetails,
  CreatePollDTO,
  MentionWithUser,
  CreateMentionDTO,
  MessageReadStatus,
  UpdatePollDTO,
  CreatePollVoteDTO,
  PollVoteWithUser,
  MessageReadWithUser,
} from "@shared/types";
import type { RootState } from "../store";
import { ApiError } from "@api/errors";
import { PaginationOptions } from "@shared/interfaces";

// State interface
interface MessageState {
  messages: MessageWithDetails[];
  selectedMessage: MessageWithDetails | null;
  status: {
    list: "idle" | "loading" | "succeeded" | "failed";
    create: "idle" | "loading" | "succeeded" | "failed";
    update: "idle" | "loading" | "succeeded" | "failed";
    delete: "idle" | "loading" | "succeeded" | "failed";
    reaction: "idle" | "loading" | "succeeded" | "failed";
    attachment: "idle" | "loading" | "succeeded" | "failed";
    poll: "idle" | "loading" | "succeeded" | "failed";
    mention: "idle" | "loading" | "succeeded" | "failed";
    read: "idle" | "loading" | "succeeded" | "failed";
  };
  error: string | null;
  hasMore: boolean;
  nextCursor?: string;
}

const initialState: MessageState = {
  messages: [],
  selectedMessage: null,
  status: {
    list: "idle",
    create: "idle",
    update: "idle",
    delete: "idle",
    reaction: "idle",
    attachment: "idle",
    poll: "idle",
    mention: "idle",
    read: "idle",
  },
  error: null,
  hasMore: false,
  nextCursor: undefined,
};

// Async Thunks
export const fetchMessages = createAsyncThunk<
  { data: MessageWithDetails[]; hasMore: boolean; nextCursor?: string },
  { householdId: string; threadId: string; options?: PaginationOptions },
  { rejectValue: string }
>(
  "messages/fetchMessages",
  async ({ householdId, threadId, options }, { rejectWithValue }) => {
    try {
      const messages = await apiClient.threads.messages.getMessages(
        householdId,
        threadId,
        options
      );
      return {
        data: messages,
        hasMore: false,
        nextCursor: undefined,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch messages");
    }
  }
);

export const createMessage = createAsyncThunk<
  MessageWithDetails,
  { householdId: string; threadId: string; messageData: CreateMessageDTO },
  { rejectValue: string }
>(
  "messages/createMessage",
  async ({ householdId, threadId, messageData }, { rejectWithValue }) => {
    try {
      const message = await apiClient.threads.messages.createMessage(
        householdId,
        threadId,
        messageData
      );
      return message;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to create message");
    }
  }
);

export const updateMessage = createAsyncThunk<
  MessageWithDetails,
  {
    householdId: string;
    threadId: string;
    messageId: string;
    messageData: UpdateMessageDTO;
  },
  { rejectValue: string }
>(
  "messages/updateMessage",
  async (
    { householdId, threadId, messageId, messageData },
    { rejectWithValue }
  ) => {
    try {
      const message = await apiClient.threads.messages.updateMessage(
        householdId,
        threadId,
        messageId,
        messageData
      );
      return message;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to update message");
    }
  }
);

export const deleteMessage = createAsyncThunk<
  string,
  { householdId: string; threadId: string; messageId: string },
  { rejectValue: string }
>(
  "messages/deleteMessage",
  async ({ householdId, threadId, messageId }, { rejectWithValue }) => {
    try {
      await apiClient.threads.messages.deleteMessage(
        householdId,
        threadId,
        messageId
      );
      return messageId;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to delete message");
    }
  }
);

// Attachments

export const getAttachments = createAsyncThunk<
  Attachment[],
  { householdId: string; threadId: string; messageId: string },
  { rejectValue: string }
>(
  "messages/getAttachments",
  async ({ householdId, threadId, messageId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.attachments.getAttachments(
        householdId,
        threadId,
        messageId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get attachments");
    }
  }
);

export const getAttachment = createAsyncThunk<
  Attachment,
  {
    householdId: string;
    threadId: string;
    messageId: string;
    attachmentId: string;
  },
  { rejectValue: string }
>(
  "messages/getAttachment",
  async (
    { householdId, threadId, messageId, attachmentId },
    { rejectWithValue }
  ) => {
    try {
      return await apiClient.threads.messages.attachments.getAttachment(
        householdId,
        threadId,
        messageId,
        attachmentId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get attachment");
    }
  }
);

export const addAttachment = createAsyncThunk<
  Attachment,
  { householdId: string; threadId: string; messageId: string; file: File },
  { rejectValue: string }
>(
  "messages/addAttachment",
  async ({ householdId, threadId, messageId, file }, { rejectWithValue }) => {
    try {
      const attachment =
        await apiClient.threads.messages.attachments.addAttachment(
          householdId,
          threadId,
          messageId,
          file
        );
      return attachment;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to add attachment");
    }
  }
);

export const deleteAttachment = createAsyncThunk<
  { messageId: string; attachmentId: string },
  {
    householdId: string;
    threadId: string;
    messageId: string;
    attachmentId: string;
  },
  { rejectValue: string }
>(
  "messages/deleteAttachment",
  async (
    { householdId, threadId, messageId, attachmentId },
    { rejectWithValue }
  ) => {
    try {
      await apiClient.threads.messages.attachments.deleteAttachment(
        householdId,
        threadId,
        messageId,
        attachmentId
      );
      return { messageId, attachmentId };
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to delete attachment");
    }
  }
);

// Reactions

export const getReactions = createAsyncThunk<
  ReactionWithUser[],
  { householdId: string; threadId: string; messageId: string },
  { rejectValue: string }
>(
  "messages/getReactions",
  async ({ householdId, threadId, messageId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.reactions.getReactions(
        householdId,
        threadId,
        messageId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get reactions");
    }
  }
);

export const addReaction = createAsyncThunk<
  ReactionWithUser,
  {
    householdId: string;
    threadId: string;
    messageId: string;
    reaction: CreateReactionDTO;
  },
  { rejectValue: string }
>(
  "messages/addReaction",
  async (
    { householdId, threadId, messageId, reaction },
    { rejectWithValue }
  ) => {
    try {
      const newReaction =
        await apiClient.threads.messages.reactions.addReaction(
          householdId,
          threadId,
          messageId,
          reaction
        );
      return newReaction;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to add reaction");
    }
  }
);

export const removeReaction = createAsyncThunk<
  { messageId: string; reactionId: string },
  {
    householdId: string;
    threadId: string;
    messageId: string;
    reactionId: string;
  },
  { rejectValue: string }
>(
  "messages/removeReaction",
  async (
    { householdId, threadId, messageId, reactionId },
    { rejectWithValue }
  ) => {
    try {
      await apiClient.threads.messages.reactions.removeReaction(
        householdId,
        threadId,
        messageId,
        reactionId
      );
      return { messageId, reactionId };
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to remove reaction");
    }
  }
);

export const getReactionAnalytics = createAsyncThunk<
  any,
  { householdId: string },
  { rejectValue: string }
>(
  "messages/getReactionAnalytics",
  async ({ householdId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.reactions.getReactionAnalytics(
        householdId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get reaction analytics");
    }
  }
);

export const getReactionsByType = createAsyncThunk<
  any,
  { householdId: string },
  { rejectValue: string }
>(
  "messages/getReactionsByType",
  async ({ householdId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.reactions.getReactionsByType(
        householdId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get reactions by type");
    }
  }
);

//Polls

export const getPollsInThread = createAsyncThunk<
  PollWithDetails[],
  { householdId: string; threadId: string; messageId: string },
  { rejectValue: string }
>(
  "messages/getPollsInThread",
  async ({ householdId, threadId, messageId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.polls.getPollsInThread(
        householdId,
        threadId,
        messageId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get polls in thread");
    }
  }
);

export const getPoll = createAsyncThunk<
  PollWithDetails,
  { householdId: string; threadId: string; messageId: string; pollId: string },
  { rejectValue: string }
>(
  "messages/getPoll",
  async ({ householdId, threadId, messageId, pollId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.polls.getPoll(
        householdId,
        threadId,
        messageId,
        pollId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get poll");
    }
  }
);

export const createPoll = createAsyncThunk<
  PollWithDetails,
  {
    householdId: string;
    threadId: string;
    messageId: string;
    pollData: CreatePollDTO;
  },
  { rejectValue: string }
>(
  "messages/createPoll",
  async (
    { householdId, threadId, messageId, pollData },
    { rejectWithValue }
  ) => {
    try {
      const poll = await apiClient.threads.messages.polls.createPoll(
        householdId,
        threadId,
        messageId,
        pollData
      );
      return poll;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to create poll");
    }
  }
);

export const updatePoll = createAsyncThunk<
  PollWithDetails,
  {
    householdId: string;
    threadId: string;
    messageId: string;
    pollId: string;
    pollData: UpdatePollDTO;
  },
  { rejectValue: string }
>(
  "messages/updatePoll",
  async (
    { householdId, threadId, messageId, pollId, pollData },
    { rejectWithValue }
  ) => {
    try {
      return await apiClient.threads.messages.polls.updatePoll(
        householdId,
        threadId,
        messageId,
        pollId,
        pollData
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to update poll");
    }
  }
);

export const deletePoll = createAsyncThunk<
  void,
  { householdId: string; threadId: string; messageId: string; pollId: string },
  { rejectValue: string }
>(
  "messages/deletePoll",
  async ({ householdId, threadId, messageId, pollId }, { rejectWithValue }) => {
    try {
      await apiClient.threads.messages.polls.deletePoll(
        householdId,
        threadId,
        messageId,
        pollId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to delete poll");
    }
  }
);

export const votePoll = createAsyncThunk<
  { poll: PollWithDetails; messageId: string },
  {
    householdId: string;
    threadId: string;
    messageId: string;
    pollId: string;
    vote: CreatePollVoteDTO;
  },
  { rejectValue: string }
>(
  "messages/votePoll",
  async (
    { householdId, threadId, messageId, pollId, vote },
    { rejectWithValue }
  ) => {
    try {
      // First, submit the vote
      await apiClient.threads.messages.polls.votePoll(
        householdId,
        threadId,
        messageId,
        pollId,
        vote
      );

      // Then fetch the updated poll details
      const poll = await apiClient.threads.messages.polls.getPoll(
        householdId,
        threadId,
        messageId,
        pollId
      );

      return { poll, messageId };
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to vote on poll");
    }
  }
);

export const removePollVote = createAsyncThunk<
  { poll: PollWithDetails; messageId: string },
  {
    householdId: string;
    threadId: string;
    messageId: string;
    pollId: string;
    optionId: string;
  },
  { rejectValue: string }
>(
  "messages/removePollVote",
  async (
    { householdId, threadId, messageId, pollId, optionId },
    { rejectWithValue }
  ) => {
    try {
      // First remove the vote
      await apiClient.threads.messages.polls.removePollVote(
        householdId,
        threadId,
        messageId,
        pollId,
        optionId
      );

      // Then fetch the updated poll details
      const poll = await apiClient.threads.messages.polls.getPoll(
        householdId,
        threadId,
        messageId,
        pollId
      );

      return { poll, messageId };
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to remove poll vote");
    }
  }
);

export const getPollAnalytics = createAsyncThunk<
  any,
  {
    householdId: string;
    threadId: string;
    messageId: string;
    pollId: string;
  },
  { rejectValue: string }
>(
  "messages/getPollAnalytics",
  async ({ householdId, threadId, messageId, pollId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.polls.getPollAnalytics(
        householdId,
        threadId,
        messageId,
        pollId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get poll analytics");
    }
  }
);

// Read Status
export const markMessageAsRead = createAsyncThunk<
  { messageRead: MessageReadWithUser; messageId: string },
  { householdId: string; threadId: string; messageId: string },
  { rejectValue: string }
>(
  "messages/markMessageAsRead",
  async ({ householdId, threadId, messageId }, { rejectWithValue }) => {
    try {
      const messageRead = await apiClient.threads.messages.markAsRead(
        householdId,
        threadId,
        messageId
      );
      return { messageRead, messageId };
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to mark message as read");
    }
  }
);

export const getMessageReadStatus = createAsyncThunk<
  MessageReadStatus,
  { householdId: string; threadId: string; messageId: string },
  { rejectValue: string }
>(
  "messages/getReadStatus",
  async ({ householdId, threadId, messageId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.readStatus.getReadStatus(
        householdId,
        threadId,
        messageId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get message read status");
    }
  }
);

// Mentions

export const getUserMentions = createAsyncThunk<
  MentionWithUser[],
  { householdId: string },
  { rejectValue: string }
>("messages/getUserMentions", async ({ householdId }, { rejectWithValue }) => {
  try {
    return await apiClient.threads.messages.mentions.getUserMentions(
      householdId
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("Failed to get user mentions");
  }
});

export const getMessageMentions = createAsyncThunk<
  MentionWithUser[],
  { householdId: string; threadId: string; messageId: string },
  { rejectValue: string }
>(
  "messages/getMessageMentions",
  async ({ householdId, threadId, messageId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.mentions.getMessageMentions(
        householdId,
        threadId,
        messageId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get message mentions");
    }
  }
);

export const createMention = createAsyncThunk<
  MentionWithUser,
  {
    householdId: string;
    threadId: string;
    messageId: string;
    mentionData: CreateMentionDTO;
  },
  { rejectValue: string }
>(
  "messages/createMention",
  async (
    { householdId, threadId, messageId, mentionData },
    { rejectWithValue }
  ) => {
    try {
      return await apiClient.threads.messages.mentions.createMention(
        householdId,
        threadId,
        messageId,
        mentionData
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to create mention");
    }
  }
);

export const deleteMention = createAsyncThunk<
  void,
  {
    householdId: string;
    threadId: string;
    messageId: string;
    mentionId: string;
  },
  { rejectValue: string }
>(
  "messages/deleteMention",
  async (
    { householdId, threadId, messageId, mentionId },
    { rejectWithValue }
  ) => {
    try {
      await apiClient.threads.messages.mentions.deleteMention(
        householdId,
        threadId,
        messageId,
        mentionId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to delete mention");
    }
  }
);

export const getUnreadMentionsCount = createAsyncThunk<
  number,
  { householdId: string },
  { rejectValue: string }
>(
  "messages/getUnreadMentionsCount",
  async ({ householdId }, { rejectWithValue }) => {
    try {
      return await apiClient.threads.messages.mentions.getUnreadMentionsCount(
        householdId
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to get unread mentions count");
    }
  }
);

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    resetMessages: () => initialState,
    selectMessage: (
      state,
      action: PayloadAction<MessageWithDetails | null>
    ) => {
      state.selectedMessage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.status.list = "loading";
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status.list = "succeeded";
        state.messages = action.payload.data;
        state.hasMore = action.payload.hasMore;
        state.nextCursor = action.payload.nextCursor;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status.list = "failed";
        state.error = action.payload as string;
      })

      // Create Message
      .addCase(createMessage.pending, (state) => {
        state.status.create = "loading";
        state.error = null;
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        state.status.create = "succeeded";
        state.messages.unshift(action.payload);
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.status.create = "failed";
        state.error = action.payload as string;
      })

      // Update Message
      .addCase(updateMessage.pending, (state) => {
        state.status.update = "loading";
        state.error = null;
      })
      .addCase(updateMessage.fulfilled, (state, action) => {
        state.status.update = "succeeded";
        const index = state.messages.findIndex(
          (m) => m.id === action.payload.id
        );
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      .addCase(updateMessage.rejected, (state, action) => {
        state.status.update = "failed";
        state.error = action.payload as string;
      })

      // Delete Message
      .addCase(deleteMessage.pending, (state) => {
        state.status.delete = "loading";
        state.error = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.status.delete = "succeeded";
        state.messages = state.messages.filter((m) => m.id !== action.payload);
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.status.delete = "failed";
        state.error = action.payload as string;
      })

      // Add Reaction
      .addCase(addReaction.pending, (state) => {
        state.status.reaction = "loading";
        state.error = null;
      })
      .addCase(addReaction.fulfilled, (state, action) => {
        state.status.reaction = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1) {
          if (!state.messages[messageIndex].reactions) {
            state.messages[messageIndex].reactions = [];
          }
          state.messages[messageIndex].reactions?.push(action.payload);
        }
      })
      .addCase(addReaction.rejected, (state, action) => {
        state.status.reaction = "failed";
        state.error = action.payload as string;
      })

      // Remove Reaction
      .addCase(removeReaction.pending, (state) => {
        state.status.reaction = "loading";
        state.error = null;
      })
      .addCase(removeReaction.fulfilled, (state, action) => {
        state.status.reaction = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1 && state.messages[messageIndex].reactions) {
          state.messages[messageIndex].reactions = state.messages[
            messageIndex
          ].reactions?.filter((r) => r.id !== action.payload.reactionId);
        }
      })
      .addCase(removeReaction.rejected, (state, action) => {
        state.status.reaction = "failed";
        state.error = action.payload as string;
      })

      // Add Attachment
      .addCase(addAttachment.pending, (state) => {
        state.status.attachment = "loading";
        state.error = null;
      })
      .addCase(addAttachment.fulfilled, (state, action) => {
        state.status.attachment = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1) {
          if (!state.messages[messageIndex].attachments) {
            state.messages[messageIndex].attachments = [];
          }
          state.messages[messageIndex].attachments?.push(action.payload);
        }
      })
      .addCase(addAttachment.rejected, (state, action) => {
        state.status.attachment = "failed";
        state.error = action.payload as string;
      })

      // Remove Attachment
      .addCase(deleteAttachment.pending, (state) => {
        state.status.attachment = "loading";
        state.error = null;
      })
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        state.status.attachment = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1 && state.messages[messageIndex].attachments) {
          state.messages[messageIndex].attachments = state.messages[
            messageIndex
          ].attachments?.filter((a) => a.id !== action.payload.attachmentId);
        }
      })
      .addCase(deleteAttachment.rejected, (state, action) => {
        state.status.attachment = "failed";
        state.error = action.payload as string;
      })

      // Create Poll
      .addCase(createPoll.pending, (state) => {
        state.status.poll = "loading";
        state.error = null;
      })
      .addCase(createPoll.fulfilled, (state, action) => {
        state.status.poll = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1) {
          state.messages[messageIndex].poll = action.payload;
        }
      })
      .addCase(createPoll.rejected, (state, action) => {
        state.status.poll = "failed";
        state.error = action.payload as string;
      })

      // Update Poll
      .addCase(updatePoll.pending, (state) => {
        state.status.poll = "loading";
        state.error = null;
      })
      .addCase(updatePoll.fulfilled, (state, action) => {
        state.status.poll = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1) {
          state.messages[messageIndex].poll = action.payload;
        }
      })
      .addCase(updatePoll.rejected, (state, action) => {
        state.status.poll = "failed";
        state.error = action.payload as string;
      })

      // Vote on Poll
      .addCase(votePoll.pending, (state) => {
        state.status.poll = "loading";
        state.error = null;
      })
      .addCase(votePoll.fulfilled, (state, action) => {
        state.status.poll = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1 && state.messages[messageIndex].poll) {
          state.messages[messageIndex].poll = action.payload.poll;
        }
      })
      .addCase(votePoll.rejected, (state, action) => {
        state.status.poll = "failed";
        state.error = action.payload as string;
      })

      // Remove Poll Vote
      .addCase(removePollVote.pending, (state) => {
        state.status.poll = "loading";
        state.error = null;
      })
      .addCase(removePollVote.fulfilled, (state, action) => {
        state.status.poll = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1 && state.messages[messageIndex].poll) {
          state.messages[messageIndex].poll = action.payload.poll;
        }
      })
      .addCase(removePollVote.rejected, (state, action) => {
        state.status.poll = "failed";
        state.error = action.payload as string;
      })

      // Mark as Read
      .addCase(markMessageAsRead.pending, (state) => {
        state.status.read = "loading";
        state.error = null;
      })
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        state.status.read = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1) {
          if (!state.messages[messageIndex].reads) {
            state.messages[messageIndex].reads = [];
          }
          const existingReadIndex = state.messages[
            messageIndex
          ].reads?.findIndex(
            (r) => r.userId === action.payload.messageRead.userId
          );
          if (existingReadIndex === -1 || existingReadIndex === undefined) {
            state.messages[messageIndex].reads?.push(
              action.payload.messageRead
            );
          }
        }
      })
      .addCase(markMessageAsRead.rejected, (state, action) => {
        state.status.read = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { resetMessages, selectMessage, clearError } =
  messagesSlice.actions;
export default messagesSlice.reducer;

// Selectors
export const selectMessages = (state: RootState) => state.messages.messages;
export const selectSelectedMessage = (state: RootState) =>
  state.messages.selectedMessage;
export const selectMessageStatus = (state: RootState) => state.messages.status;
export const selectMessageError = (state: RootState) => state.messages.error;
export const selectHasMore = (state: RootState) => state.messages.hasMore;
export const selectNextCursor = (state: RootState) => state.messages.nextCursor;
