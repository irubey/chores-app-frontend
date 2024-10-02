import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Message, CreateMessageDTO, UpdateMessageDTO, Thread, Attachment } from '../../types/message';
import { RootState } from '../store';

interface MessagesState {
  messages: Message[];
  threads: { [messageId: string]: Thread[] };
  attachments: { [messageId: string]: Attachment[] };
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: [],
  threads: {},
  attachments: {},
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
};

// Async thunks
export const fetchMessages = createAsyncThunk<Message[], string, { rejectValue: string }>(
  'messages/fetchMessages',
  async (householdId, thunkAPI) => {
    try {
      const response = await apiClient.messages.getMessages(householdId);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch messages';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addMessage = createAsyncThunk<Message, { householdId: string; messageData: CreateMessageDTO }, { rejectValue: string }>(
  'messages/addMessage',
  async ({ householdId, messageData }, thunkAPI) => {
    try {
      const response = await apiClient.messages.createMessage(householdId, messageData);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to add message';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateMessage = createAsyncThunk<Message, { householdId: string; messageId: string; messageData: UpdateMessageDTO }, { rejectValue: string }>(
  'messages/updateMessage',
  async ({ householdId, messageId, messageData }, thunkAPI) => {
    try {
      const response = await apiClient.messages.updateMessage(householdId, messageId, messageData);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update message';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteMessage = createAsyncThunk<string, { householdId: string; messageId: string }, { rejectValue: string }>(
  'messages/deleteMessage',
  async ({ householdId, messageId }, thunkAPI) => {
    try {
      await apiClient.messages.deleteMessage(householdId, messageId);
      return messageId;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete message';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addThread = createAsyncThunk<Thread, { householdId: string; messageId: string; threadData: { content: string } }, { rejectValue: string }>(
  'messages/addThread',
  async ({ householdId, messageId, threadData }, thunkAPI) => {
    try {
      const response = await apiClient.messages.createThread(householdId, messageId, threadData);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to add thread';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addAttachment = createAsyncThunk<Attachment, { householdId: string; messageId: string; file: File }, { rejectValue: string }>(
  'messages/addAttachment',
  async ({ householdId, messageId, file }, thunkAPI) => {
    try {
      const response = await apiClient.messages.uploadAttachment(householdId, messageId, file);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to add attachment';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Slice
const messagesSlice = createSlice({
  name: 'messages',
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
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<Message[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages = action.payload;
        action.payload.forEach(message => {
          state.threads[message.id] = message.threads || [];
          state.attachments[message.id] = message.attachments || [];
        });
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || 'Failed to fetch messages';
      })
      // Add Message
      .addCase(addMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages.unshift(action.payload);
        state.threads[action.payload.id] = action.payload.threads || [];
        state.attachments[action.payload.id] = action.payload.attachments || [];
      })
      .addCase(addMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || 'Failed to add message';
      })
      // Update Message
      .addCase(updateMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.messages.findIndex(msg => msg.id === action.payload.id);
        if (index !== -1) {
          state.messages[index] = action.payload;
          state.threads[action.payload.id] = action.payload.threads || [];
          state.attachments[action.payload.id] = action.payload.attachments || [];
        }
      })
      .addCase(updateMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || 'Failed to update message';
      })
      // Delete Message
      .addCase(deleteMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMessage.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages = state.messages.filter(msg => msg.id !== action.payload);
        delete state.threads[action.payload];
        delete state.attachments[action.payload];
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || 'Failed to delete message';
      })
      // Add Thread
      .addCase(addThread.fulfilled, (state, action: PayloadAction<Thread>) => {
        const messageId = action.payload.messageId;
        if (!state.threads[messageId]) {
          state.threads[messageId] = [];
        }
        state.threads[messageId].push(action.payload);
      })
      // Add Attachment
      .addCase(addAttachment.fulfilled, (state, action: PayloadAction<Attachment>) => {
        const messageId = action.payload.messageId!;
        if (!state.attachments[messageId]) {
          state.attachments[messageId] = [];
        }
        state.attachments[messageId].push(action.payload);
      });
  },
});

export const { reset } = messagesSlice.actions;

export const selectMessages = (state: RootState) => state.messages;

export default messagesSlice.reducer;