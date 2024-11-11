import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/api/apiClient";
import {
  NotificationWithUser,
  UpdateNotificationSettingsDTO,
} from "@shared/types";
import { RootState } from "../store";
import { logger } from "../../lib/api/logger";
import { ApiError } from "@/lib/api/errors";

interface NotificationsState {
  notifications: NotificationWithUser[];
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
  message: "",
};

// Async thunks
export const fetchNotifications = createAsyncThunk<
  NotificationWithUser[],
  void,
  { rejectValue: string }
>("notifications/fetchNotifications", async (_, thunkAPI) => {
  try {
    logger.debug("Fetching notifications");
    const response = await apiClient.notifications.getNotifications();
    logger.debug("Notifications fetched successfully", {
      count: response.data.length,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to fetch notifications");
  }
});

export const markNotificationAsRead = createAsyncThunk<
  NotificationWithUser,
  string,
  { rejectValue: string }
>("notifications/markAsRead", async (notificationId, thunkAPI) => {
  try {
    logger.debug("Marking notification as read", { notificationId });
    const response = await apiClient.notifications.markNotificationAsRead(
      notificationId
    );
    logger.debug("Notification marked as read successfully", {
      notificationId,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to mark notification as read");
  }
});

export const deleteNotification = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notifications/deleteNotification", async (notificationId, thunkAPI) => {
  try {
    logger.debug("Deleting notification", { notificationId });
    await apiClient.notifications.deleteNotification(notificationId);
    logger.debug("Notification deleted successfully", { notificationId });
    return notificationId;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to delete notification");
  }
});

// Slice
const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        fetchNotifications.fulfilled,
        (state, action: PayloadAction<NotificationWithUser[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.notifications = action.payload;
        }
      )
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to fetch notifications";
      })
      // Mark Notification as Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        markNotificationAsRead.fulfilled,
        (state, action: PayloadAction<NotificationWithUser>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.notifications.findIndex(
            (n) => n.id === action.payload.id
          );
          if (index !== -1) {
            state.notifications[index] = action.payload;
          }
        }
      )
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to mark notification as read";
      })
      // Delete Notification
      .addCase(deleteNotification.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        deleteNotification.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.notifications = state.notifications.filter(
            (n) => n.id !== action.payload
          );
        }
      )
      .addCase(deleteNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to delete notification";
      });
  },
});

export const { reset } = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state: RootState): NotificationsState =>
  state.notifications;
export const selectAllNotifications = (
  state: RootState
): NotificationWithUser[] => state.notifications.notifications;
export const selectUnreadNotifications = (
  state: RootState
): NotificationWithUser[] =>
  state.notifications.notifications.filter((n) => !n.isRead);

export default notificationsSlice.reducer;
