import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "@api/apiClient";
import {
  Message,
  CreateMessageDTO,
  UpdateMessageDTO,
  Attachment,
} from "@shared/types";
import type { RootState } from "../store";
import { ApiError } from "@api/errors";

interface MessageState {
  messages: Message[];
  status: {
    list: "idle" | "loading" | "succeeded" | "failed";
    create: "idle" | "loading" | "succeeded" | "failed";
    update: "idle" | "loading" | "succeeded" | "failed";
    delete: "idle" | "loading" | "succeeded" | "failed";
    attachment: "idle" | "loading" | "succeeded" | "failed";
  };
  error: string | null;
}

const initialState: MessageState = {
  messages: [],
  status: {
    list: "idle",
    create: "idle",
    update: "idle",
    delete: "idle",
    attachment: "idle",
  },
  error: null,
};

// Async Thunks
export const fetchMessages = createAsyncThunk<
  Message[],
  { householdId: string; threadId: string },
  { rejectValue: string }
>(
  "messages/fetchMessages",
  async ({ householdId, threadId }, { rejectWithValue }) => {
    try {
      const messages = await apiClient.threads.messages.getMessages(
        householdId,
        threadId
      );
      return messages;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch messages");
    }
  }
);

export const createMessage = createAsyncThunk<
  Message,
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
  Message,
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

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    resetMessages: (state) => {
      return initialState;
    },
    clearMessageError: (state) => {
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
        state.messages = action.payload;
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
      });
  },
});

export const { resetMessages, clearMessageError } = messagesSlice.actions;
export default messagesSlice.reducer;

// Selectors
export const selectMessages = (state: RootState) => state.messages.messages;
export const selectMessageStatus = (state: RootState) => state.messages.status;
export const selectMessageError = (state: RootState) => state.messages.error;
