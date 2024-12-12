// frontend/src/store/slices/threadSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "@api/apiClient";
import {
  Thread,
  ThreadWithMessages,
  ThreadWithParticipants,
  CreateThreadDTO,
  UpdateThreadDTO,
  ThreadWithDetails,
} from "@shared/types";
import { PaginationOptions } from "@shared/interfaces";
import type { RootState } from "../store";
import { ApiError } from "@api/errors";

export interface ThreadState {
  threads: ThreadWithDetails[];
  selectedThread: ThreadWithDetails | null;
  hasMore: boolean;
  nextCursor?: string;
  status: {
    list: "idle" | "loading" | "succeeded" | "failed";
    create: "idle" | "loading" | "succeeded" | "failed";
    update: "idle" | "loading" | "succeeded" | "failed";
    delete: "idle" | "loading" | "succeeded" | "failed";
    invite: "idle" | "loading" | "succeeded" | "failed";
    details: "idle" | "loading" | "succeeded" | "failed";
  };
  error: string | null;
}

const initialState: ThreadState = {
  threads: [],
  selectedThread: null,
  hasMore: true,
  nextCursor: undefined,
  status: {
    list: "idle",
    create: "idle",
    update: "idle",
    delete: "idle",
    invite: "idle",
    details: "idle",
  },
  error: null,
};

// Async Thunks
export const fetchThreads = createAsyncThunk<
  ThreadWithDetails[],
  { householdId: string; options?: PaginationOptions },
  {
    rejectValue: string;
    fulfilledMeta: { hasMore: boolean; nextCursor?: string };
  }
>(
  "threads/fetchThreads",
  async ({ householdId, options }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await apiClient.threads.threads.getThreads(
        householdId,
        options
      );
      return fulfillWithValue(response.data, {
        hasMore: response.pagination?.hasMore ?? false,
        nextCursor: response.pagination?.nextCursor,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch threads");
    }
  }
);

export const createThread = createAsyncThunk<
  ThreadWithParticipants,
  { householdId: string; threadData: CreateThreadDTO },
  { rejectValue: string }
>(
  "threads/createThread",
  async ({ householdId, threadData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.threads.threads.createThread(
        householdId,
        threadData
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to create thread");
    }
  }
);

export const fetchThreadDetails = createAsyncThunk<
  ThreadWithMessages,
  { householdId: string; threadId: string },
  { rejectValue: string }
>(
  "threads/fetchThreadDetails",
  async ({ householdId, threadId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.threads.threads.getThreadDetails(
        householdId,
        threadId
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch thread details");
    }
  }
);

export const updateThread = createAsyncThunk<
  Thread,
  { householdId: string; threadId: string; threadData: UpdateThreadDTO },
  { rejectValue: string }
>(
  "threads/updateThread",
  async ({ householdId, threadId, threadData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.threads.threads.updateThread(
        householdId,
        threadId,
        threadData
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to update thread");
    }
  }
);

export const deleteThread = createAsyncThunk<
  string,
  { householdId: string; threadId: string },
  { rejectValue: string }
>(
  "threads/deleteThread",
  async ({ householdId, threadId }, { rejectWithValue }) => {
    try {
      await apiClient.threads.threads.deleteThread(householdId, threadId);
      return threadId;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to delete thread");
    }
  }
);

export const inviteUsersToThread = createAsyncThunk<
  ThreadWithParticipants,
  { householdId: string; threadId: string; userIds: string[] },
  { rejectValue: string }
>(
  "threads/inviteUsers",
  async ({ householdId, threadId, userIds }, { rejectWithValue }) => {
    try {
      const response = await apiClient.threads.threads.inviteUsers(
        householdId,
        threadId,
        userIds
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to invite users to thread");
    }
  }
);

const threadSlice = createSlice({
  name: "threads",
  initialState,
  reducers: {
    resetThreads: () => initialState,
    selectThread: (state, action: PayloadAction<ThreadWithDetails | null>) => {
      state.selectedThread = action.payload;
    },
    clearThreadError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Threads
      .addCase(fetchThreads.pending, (state) => {
        state.status.list = "loading";
        state.error = null;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.status.list = "succeeded";
        if (action.meta.arg.options?.cursor) {
          state.threads = [...state.threads, ...action.payload];
        } else {
          state.threads = action.payload;
        }
        state.hasMore = action.meta.hasMore;
        state.nextCursor = action.meta.nextCursor;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.status.list = "failed";
        state.error = action.payload as string;
      })

      // Create Thread
      .addCase(createThread.pending, (state) => {
        state.status.create = "loading";
        state.error = null;
      })
      .addCase(createThread.fulfilled, (state, action) => {
        state.status.create = "succeeded";
        state.threads.unshift({
          ...action.payload,
          messages: [],
        });
      })
      .addCase(createThread.rejected, (state, action) => {
        state.status.create = "failed";
        state.error = action.payload || "Failed to create thread";
      })

      // Fetch Thread Details
      .addCase(fetchThreadDetails.pending, (state) => {
        state.status.details = "loading";
        state.error = null;
      })
      .addCase(fetchThreadDetails.fulfilled, (state, action) => {
        state.status.details = "succeeded";
        state.selectedThread = action.payload;
        // Update thread in list if exists
        const index = state.threads.findIndex(
          (t) => t.id === action.payload.id
        );
        if (index !== -1) {
          state.threads[index] = action.payload;
        }
      })
      .addCase(fetchThreadDetails.rejected, (state, action) => {
        state.status.details = "failed";
        state.error = action.payload || "Failed to fetch thread details";
      })

      // Update Thread
      .addCase(updateThread.pending, (state) => {
        state.status.update = "loading";
        state.error = null;
      })
      .addCase(updateThread.fulfilled, (state, action) => {
        state.status.update = "succeeded";
        const index = state.threads.findIndex(
          (t) => t.id === action.payload.id
        );
        if (index !== -1) {
          state.threads[index] = { ...state.threads[index], ...action.payload };
        }
        if (state.selectedThread?.id === action.payload.id) {
          state.selectedThread = {
            ...state.selectedThread,
            ...action.payload,
          };
        }
      })
      .addCase(updateThread.rejected, (state, action) => {
        state.status.update = "failed";
        state.error = action.payload || "Failed to update thread";
      })

      // Delete Thread
      .addCase(deleteThread.pending, (state) => {
        state.status.delete = "loading";
        state.error = null;
      })
      .addCase(deleteThread.fulfilled, (state, action) => {
        state.status.delete = "succeeded";
        state.threads = state.threads.filter((t) => t.id !== action.payload);
        if (state.selectedThread?.id === action.payload) {
          state.selectedThread = null;
        }
      })
      .addCase(deleteThread.rejected, (state, action) => {
        state.status.delete = "failed";
        state.error = action.payload || "Failed to delete thread";
      })

      // Invite Users
      .addCase(inviteUsersToThread.pending, (state) => {
        state.status.invite = "loading";
        state.error = null;
      })
      .addCase(inviteUsersToThread.fulfilled, (state, action) => {
        state.status.invite = "succeeded";
        const index = state.threads.findIndex(
          (t) => t.id === action.payload.id
        );
        if (index !== -1) {
          state.threads[index] = {
            ...state.threads[index],
            ...action.payload,
          };
        }
        if (state.selectedThread?.id === action.payload.id) {
          state.selectedThread = {
            ...state.selectedThread,
            ...action.payload,
          };
        }
      })
      .addCase(inviteUsersToThread.rejected, (state, action) => {
        state.status.invite = "failed";
        state.error = action.payload ?? "Failed to invite users to thread";
      });
  },
});

export const { resetThreads, selectThread, clearThreadError } =
  threadSlice.actions;
export default threadSlice.reducer;

// Selectors
export const selectThreads = (state: RootState) => state.threads.threads;
export const selectSelectedThread = (state: RootState) =>
  state.threads.selectedThread;
export const selectThreadStatus = (state: RootState) => state.threads.status;
export const selectThreadError = (state: RootState) => state.threads.error;
