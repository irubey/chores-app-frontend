import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import {
  Message,
  CreateMessageDTO,
  UpdateMessageDTO,
  Thread,
  Attachment,
} from "../../types/message";
import { RootState } from "../store";

interface MessagesState {
  messages: Message[];
  threads: Thread[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: [],
  threads: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
};

// Async thunks
export const fetchThreads = createAsyncThunk<
  Thread[],
  string,
  { rejectValue: string }
>("messages/fetchThreads", async (householdId, thunkAPI) => {
  try {
    const response = await apiClient.messages.getThreads(householdId);
    return response;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch threads";
    return thunkAPI.rejectWithValue(message);
  }
});

export const createThread = createAsyncThunk<
  Thread,
  { householdId: string; data: { title: string; participants: string[] } },
  { rejectValue: string }
>("messages/createThread", async ({ householdId, data }, thunkAPI) => {
  try {
    const response = await apiClient.messages.createThread(householdId, data);
    return response;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to create thread";
    return thunkAPI.rejectWithValue(message);
  }
});

export const fetchMessages = createAsyncThunk<
  Message[],
  { householdId: string; threadId: string },
  { rejectValue: string }
>("messages/fetchMessages", async ({ householdId, threadId }, thunkAPI) => {
  try {
    const response = await apiClient.messages.getMessages(
      householdId,
      threadId
    );
    return response;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch messages";
    return thunkAPI.rejectWithValue(message);
  }
});

export const sendMessage = createAsyncThunk<
  Message,
  { householdId: string; threadId: string; messageData: CreateMessageDTO },
  { rejectValue: string }
>(
  "messages/sendMessage",
  async ({ householdId, threadId, messageData }, thunkAPI) => {
    try {
      const response = await apiClient.messages.sendMessage(
        householdId,
        threadId,
        messageData
      );
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to send message";
      return thunkAPI.rejectWithValue(message);
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
  async ({ householdId, threadId, messageId, messageData }, thunkAPI) => {
    try {
      const response = await apiClient.messages.updateMessage(
        householdId,
        threadId,
        messageId,
        messageData
      );
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update message";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteMessage = createAsyncThunk<
  void,
  { householdId: string; threadId: string; messageId: string },
  { rejectValue: string }
>(
  "messages/deleteMessage",
  async ({ householdId, threadId, messageId }, thunkAPI) => {
    try {
      await apiClient.messages.deleteMessage(householdId, threadId, messageId);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete message";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Slice
const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Threads
      .addCase(fetchThreads.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        fetchThreads.fulfilled,
        (state, action: PayloadAction<Thread[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.threads = action.payload;
        }
      )
      .addCase(fetchThreads.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || "Failed to fetch threads";
      })
      // Create Thread
      .addCase(createThread.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        createThread.fulfilled,
        (state, action: PayloadAction<Thread>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.threads.push(action.payload);
        }
      )
      .addCase(createThread.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || "Failed to create thread";
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        fetchMessages.fulfilled,
        (state, action: PayloadAction<Message[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.messages = action.payload;
        }
      )
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || "Failed to fetch messages";
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        sendMessage.fulfilled,
        (state, action: PayloadAction<Message>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.messages.push(action.payload);
        }
      )
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || "Failed to send message";
      })
      // Update Message
      .addCase(updateMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateMessage.fulfilled,
        (state, action: PayloadAction<Message>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.messages.findIndex(
            (msg) => msg.id === action.payload.id
          );
          if (index !== -1) {
            state.messages[index] = action.payload;
          }
        }
      )
      .addCase(updateMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || "Failed to update message";
      })
      // Delete Message
      .addCase(deleteMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages = state.messages.filter(
          (msg) => msg.id !== action.meta.arg.messageId
        );
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || "Failed to delete message";
      });
  },
});

export const { reset } = messagesSlice.actions;

export const selectMessages = (state: RootState) => state.messages;

export default messagesSlice.reducer;
