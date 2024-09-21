import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Notification } from '../../types/notification';
import { RootState } from '../store';

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: NotificationsState = {
  notifications: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Async thunks
export const fetchNotifications = createAsyncThunk<Notification[], void, { rejectValue: string }>(
  'notifications/fetchNotifications',
  async (_, thunkAPI) => {
    try {
      const notifications = await apiClient.notifications.getNotifications();
      return notifications;
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to fetch notifications';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk<void, string, { rejectValue: string }>(
  'notifications/markAsRead',
  async (notificationId, thunkAPI) => {
    try {
      await apiClient.notifications.markAsRead(notificationId);
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to mark notification as read';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Slice
const notificationsSlice = createSlice({
  name: 'notifications',
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
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Mark Notification as Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Update the specific notification as read
        const notificationId = action.meta.arg;
        const notification = state.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = notificationsSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications;

export default notificationsSlice.reducer;
