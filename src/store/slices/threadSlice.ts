// frontend/src/store/slices/threadSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "@api/apiClient";
import {
  Thread,
  ThreadWithMessages,
  ThreadWithParticipants,
  CreateThreadDTO,
  UpdateThreadDTO,
  InviteUsersDTO,
} from "@shared/types";
import type { RootState } from "../store";
import { ApiError } from "@api/errors";

// TODO: Add these interfaces when implementing pagination and filtering
// interface ThreadFilters {
//   search?: string;
//   sortBy?: 'createdAt' | 'updatedAt' | 'title';
//   sortOrder?: 'asc' | 'desc';
// }

interface ThreadState {
  threads: ThreadWithMessages[];
  selectedThread: ThreadWithMessages | null;
  status: {
    list: "idle" | "loading" | "succeeded" | "failed";
    create: "idle" | "loading" | "succeeded" | "failed";
    update: "idle" | "loading" | "succeeded" | "failed";
    delete: "idle" | "loading" | "succeeded" | "failed";
    invite: "idle" | "loading" | "succeeded" | "failed";
  };
  error: string | null;
}

const initialState: ThreadState = {
  threads: [],
  selectedThread: null,
  status: {
    list: "idle",
    create: "idle",
    update: "idle",
    delete: "idle",
    invite: "idle",
  },
  error: null,
};

export const fetchThreads = createAsyncThunk<
  ThreadWithMessages[],
  { householdId: string },
  { rejectValue: string }
>("threads/fetchThreads", async ({ householdId }, { rejectWithValue }) => {
  try {
    const threads = await apiClient.threads.getThreads(householdId);
    return threads;
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("Failed to fetch threads");
  }
});

export const createThread = createAsyncThunk<
  ThreadWithMessages,
  { householdId: string; threadData: CreateThreadDTO },
  { rejectValue: string }
>(
  "threads/createThread",
  async ({ householdId, threadData }, { rejectWithValue }) => {
    try {
      const thread = await apiClient.threads.createThread(
        householdId,
        threadData
      );
      return {
        ...thread,
        messages: [],
      };
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
      const thread = await apiClient.threads.getThreadDetails(
        householdId,
        threadId
      );
      return thread;
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
      const thread = await apiClient.threads.updateThread(
        householdId,
        threadId,
        threadData
      );
      return thread;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to update thread");
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
      const thread = await apiClient.threads.inviteUsers(
        householdId,
        threadId,
        userIds
      );
      return thread;
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
    resetThreads: (state) => {
      return initialState;
    },
    selectThread: (state, action: PayloadAction<ThreadWithMessages | null>) => {
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
        state.threads = action.payload;
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
        // Add the new thread to the list
        state.threads.unshift(action.payload as ThreadWithMessages);
      })
      .addCase(createThread.rejected, (state, action) => {
        state.status.create = "failed";
        state.error = action.payload || "Failed to create thread";
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
          state.selectedThread = { ...state.selectedThread, ...action.payload };
        }
      })
      .addCase(updateThread.rejected, (state, action) => {
        state.status.update = "failed";
        state.error = action.payload || "Failed to update thread";
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
            messages: state.threads[index].messages,
          };
        }
        if (state.selectedThread?.id === action.payload.id) {
          state.selectedThread = {
            ...state.selectedThread,
            ...action.payload,
            messages: state.selectedThread.messages,
          };
        }
      })
      .addCase(inviteUsersToThread.rejected, (state, action) => {
        state.status.invite = "failed";
        state.error = action.payload || "Failed to invite users to thread";
      });
  },
});

// Actions and Reducer

export const { resetThreads, selectThread, clearThreadError } =
  threadSlice.actions;
export default threadSlice.reducer;

// Selector

export const selectThreads = (state: RootState) => state.threads.threads;
export const selectSelectedThread = (state: RootState) =>
  state.threads.selectedThread;
export const selectThreadStatus = (state: RootState) => state.threads.status;
export const selectThreadError = (state: RootState) => state.threads.error;
