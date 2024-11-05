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
      const response = await apiClient.threads.messages.getMessages(
        householdId,
        threadId,
        options
      );
      return {
        data: response.data,
        hasMore: response.pagination?.hasMore || false,
        nextCursor: response.pagination?.nextCursor,
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
  void,
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
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to delete attachment");
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

export const markMessageAsRead = createAsyncThunk<
  void,
  { householdId: string; threadId: string; messageId: string },
  { rejectValue: string }
>(
  "messages/markAsRead",
  async ({ householdId, threadId, messageId }, { rejectWithValue }) => {
    try {
      await apiClient.threads.messages.readStatus.markAsRead(
        householdId,
        threadId,
        messageId
      );
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

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    resetMessages: () => initialState,
    clearMessageError: (state) => {
      state.error = null;
    },
    selectMessage: (
      state,
      action: PayloadAction<MessageWithDetails | null>
    ) => {
      state.selectedMessage = action.payload;
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
        state.messages.push(action.payload);
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
        state.messages = state.messages.filter(
          (message) => message.id !== action.payload
        );
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.status.delete = "failed";
        state.error = action.payload as string;
      })
      // Add Attachment
      .addCase(addAttachment.pending, (state) => {
        state.status.attachment = "loading";
        state.error = null;
      })
      .addCase(addAttachment.fulfilled, (state) => {
        state.status.attachment = "succeeded";
      })
      .addCase(addAttachment.rejected, (state, action) => {
        state.status.attachment = "failed";
        state.error = action.payload as string;
      })
      // Delete Attachment
      .addCase(deleteAttachment.pending, (state) => {
        state.status.attachment = "loading";
        state.error = null;
      })
      .addCase(deleteAttachment.fulfilled, (state) => {
        state.status.attachment = "succeeded";
      })
      .addCase(deleteAttachment.rejected, (state, action) => {
        state.status.attachment = "failed";
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
      // Mark as Read
      .addCase(markMessageAsRead.pending, (state) => {
        state.status.read = "loading";
      })
      .addCase(markMessageAsRead.fulfilled, (state) => {
        state.status.read = "succeeded";
      })
      .addCase(markMessageAsRead.rejected, (state, action) => {
        state.status.read = "failed";
        state.error = action.payload as string;
      })
      // Create Mention
      .addCase(createMention.pending, (state) => {
        state.status.mention = "loading";
      })
      .addCase(createMention.fulfilled, (state, action) => {
        state.status.mention = "succeeded";
        const messageIndex = state.messages.findIndex(
          (m) => m.id === action.payload.messageId
        );
        if (messageIndex !== -1) {
          if (!state.messages[messageIndex].mentions) {
            state.messages[messageIndex].mentions = [];
          }
          state.messages[messageIndex].mentions?.push(action.payload);
        }
      })
      .addCase(createMention.rejected, (state, action) => {
        state.status.mention = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { resetMessages, clearMessageError, selectMessage } =
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
