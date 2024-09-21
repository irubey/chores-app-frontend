import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Message, CreateMessageDTO, UpdateMessageDTO } from '../../types/message';
import { RootState } from '../store';

interface MessagesState {
  messages: Message[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: MessagesState = {
  messages: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Async thunks
export const fetchMessages = createAsyncThunk<Message[], string, { rejectValue: string }>(
  'messages/fetchMessages',
  async (householdId, thunkAPI) => {
    try {
      const response = await apiClient.messages.getMessages(householdId);
      return response; // {{ change: return response.data instead of response }}
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to fetch messages';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addMessage = createAsyncThunk<Message, { householdId: string; messageData: CreateMessageDTO }, { rejectValue: string }>(
  'messages/addMessage',
  async ({ householdId, messageData }, thunkAPI) => {
    try {
      const response = await apiClient.messages.createMessage(householdId, messageData);
      return response; // {{ change: return response.data instead of response }}
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to add message';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateMessage = createAsyncThunk<Message, { householdId: string; messageId: string; messageData: UpdateMessageDTO }, { rejectValue: string }>(
  'messages/updateMessage',
  async ({ householdId, messageId, messageData }, thunkAPI) => {
    try {
      const response = await apiClient.messages.updateMessage(householdId, messageId, messageData);
      return response; // {{ change: return response.data instead of response }}
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to update message';
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
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to delete message';
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
      state.message = '';
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
      })
      .addCase(fetchMessages.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add Message
      .addCase(addMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages.push(action.payload);
      })
      .addCase(addMessage.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
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
        }
      })
      .addCase(updateMessage.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete Message
      .addCase(deleteMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMessage.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages = state.messages.filter(msg => msg.id !== action.payload);
      })
      .addCase(deleteMessage.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = messagesSlice.actions;

export const selectMessages = (state: RootState) => state.messages;

export default messagesSlice.reducer;
