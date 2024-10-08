import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import {
  Chore,
  CreateChoreDTO,
  UpdateChoreDTO,
  Subtask,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  ChoreSwapRequest,
  ChoreSwapRequestStatus,
} from "../../types/chore";
import { RootState } from "../store";

interface ChoresState {
  chores: {
    [choreId: string]: Chore;
  };
  isLoading: {
    fetchChores: boolean;
    createChore: boolean;
    updateChore: boolean;
    deleteChore: boolean;
    createSubtask: boolean;
    updateSubtask: boolean;
    deleteSubtask: boolean;
    requestChoreSwap: boolean;
    approveChoreSwap: boolean;
  };
  error: string | null;
}

const initialState: ChoresState = {
  chores: {},
  isLoading: {
    fetchChores: false,
    createChore: false,
    updateChore: false,
    deleteChore: false,
    createSubtask: false,
    updateSubtask: false,
    deleteSubtask: false,
    requestChoreSwap: false,
    approveChoreSwap: false,
  },
  error: null,
};

// Async thunks

export const fetchChores = createAsyncThunk<
  Chore[],
  string,
  { rejectValue: string }
>("chores/fetchChores", async (householdId, thunkAPI) => {
  try {
    return await apiClient.chores.getChores(householdId);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to fetch chores");
  }
});

export const addChore = createAsyncThunk<
  Chore,
  { householdId: string; choreData: CreateChoreDTO },
  { rejectValue: string }
>("chores/addChore", async ({ householdId, choreData }, thunkAPI) => {
  try {
    return await apiClient.chores.createChore(householdId, choreData);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to add chore");
  }
});

export const updateChore = createAsyncThunk<
  Chore,
  { householdId: string; choreId: string; choreData: UpdateChoreDTO },
  { rejectValue: string }
>(
  "chores/updateChore",
  async ({ householdId, choreId, choreData }, thunkAPI) => {
    try {
      return await apiClient.chores.updateChore(
        householdId,
        choreId,
        choreData
      );
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to update chore"
      );
    }
  }
);

export const deleteChore = createAsyncThunk<
  string,
  { householdId: string; choreId: string },
  { rejectValue: string }
>("chores/deleteChore", async ({ householdId, choreId }, thunkAPI) => {
  try {
    await apiClient.chores.deleteChore(householdId, choreId);
    return choreId;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to delete chore");
  }
});

export const addSubtask = createAsyncThunk<
  Subtask,
  { householdId: string; choreId: string; subtaskData: CreateSubtaskDTO },
  { rejectValue: string }
>(
  "chores/addSubtask",
  async ({ householdId, choreId, subtaskData }, thunkAPI) => {
    try {
      return await apiClient.chores.subtasks.createSubtask(
        householdId,
        choreId,
        subtaskData
      );
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to add subtask");
    }
  }
);

export const updateSubtask = createAsyncThunk<
  Subtask,
  {
    householdId: string;
    choreId: string;
    subtaskId: string;
    subtaskData: UpdateSubtaskDTO;
  },
  { rejectValue: string }
>(
  "chores/updateSubtask",
  async ({ householdId, choreId, subtaskId, subtaskData }, thunkAPI) => {
    try {
      return await apiClient.chores.subtasks.updateSubtask(
        householdId,
        choreId,
        subtaskId,
        subtaskData
      );
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to update subtask"
      );
    }
  }
);

export const deleteSubtask = createAsyncThunk<
  { choreId: string; subtaskId: string },
  { householdId: string; choreId: string; subtaskId: string },
  { rejectValue: string }
>(
  "chores/deleteSubtask",
  async ({ householdId, choreId, subtaskId }, thunkAPI) => {
    try {
      await apiClient.chores.subtasks.deleteSubtask(
        householdId,
        choreId,
        subtaskId
      );
      return { choreId, subtaskId };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to delete subtask"
      );
    }
  }
);

export const requestChoreSwap = createAsyncThunk<
  ChoreSwapRequest,
  { householdId: string; choreId: string; targetUserId: string },
  { rejectValue: string }
>(
  "chores/requestChoreSwap",
  async ({ householdId, choreId, targetUserId }, thunkAPI) => {
    try {
      return await apiClient.chores.requestChoreSwap(
        householdId,
        choreId,
        targetUserId
      );
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to request chore swap"
      );
    }
  }
);

export const approveChoreSwap = createAsyncThunk<
  Chore,
  {
    householdId: string;
    choreId: string;
    swapRequestId: string;
    approved: boolean;
  },
  { rejectValue: string }
>(
  "chores/approveChoreSwap",
  async ({ householdId, choreId, swapRequestId, approved }, thunkAPI) => {
    try {
      return await apiClient.chores.approveChoreSwap(
        householdId,
        choreId,
        swapRequestId,
        approved
      );
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to approve chore swap"
      );
    }
  }
);

// Slice
const choresSlice = createSlice({
  name: "chores",
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Chores
      .addCase(fetchChores.pending, (state) => {
        state.isLoading.fetchChores = true;
        state.error = null;
      })
      .addCase(
        fetchChores.fulfilled,
        (state, action: PayloadAction<Chore[]>) => {
          state.isLoading.fetchChores = false;
          state.chores = action.payload.reduce((acc, chore) => {
            acc[chore.id] = chore;
            return acc;
          }, {} as ChoresState["chores"]);
        }
      )
      .addCase(fetchChores.rejected, (state, action) => {
        state.isLoading.fetchChores = false;
        state.error = action.payload || "Failed to fetch chores";
      })

      // Add Chore
      .addCase(addChore.pending, (state) => {
        state.isLoading.createChore = true;
        state.error = null;
      })
      .addCase(addChore.fulfilled, (state, action: PayloadAction<Chore>) => {
        state.isLoading.createChore = false;
        state.chores[action.payload.id] = action.payload;
      })
      .addCase(addChore.rejected, (state, action) => {
        state.isLoading.createChore = false;
        state.error = action.payload || "Failed to add chore";
      })

      // Update Chore
      .addCase(updateChore.pending, (state) => {
        state.isLoading.updateChore = true;
        state.error = null;
      })
      .addCase(updateChore.fulfilled, (state, action: PayloadAction<Chore>) => {
        state.isLoading.updateChore = false;
        state.chores[action.payload.id] = action.payload;
      })
      .addCase(updateChore.rejected, (state, action) => {
        state.isLoading.updateChore = false;
        state.error = action.payload || "Failed to update chore";
      })

      // Delete Chore
      .addCase(deleteChore.pending, (state) => {
        state.isLoading.deleteChore = true;
        state.error = null;
      })
      .addCase(
        deleteChore.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading.deleteChore = false;
          delete state.chores[action.payload];
        }
      )
      .addCase(deleteChore.rejected, (state, action) => {
        state.isLoading.deleteChore = false;
        state.error = action.payload || "Failed to delete chore";
      })

      // Add Subtask
      .addCase(addSubtask.pending, (state) => {
        state.isLoading.createSubtask = true;
        state.error = null;
      })
      .addCase(
        addSubtask.fulfilled,
        (state, action: PayloadAction<Subtask>) => {
          state.isLoading.createSubtask = false;
          const chore = state.chores[action.payload.choreId];
          if (chore) {
            chore.subtasks = chore.subtasks
              ? [...chore.subtasks, action.payload]
              : [action.payload];
          }
        }
      )
      .addCase(addSubtask.rejected, (state, action) => {
        state.isLoading.createSubtask = false;
        state.error = action.payload || "Failed to add subtask";
      })

      // Update Subtask
      .addCase(updateSubtask.pending, (state) => {
        state.isLoading.updateSubtask = true;
        state.error = null;
      })
      .addCase(
        updateSubtask.fulfilled,
        (state, action: PayloadAction<Subtask>) => {
          state.isLoading.updateSubtask = false;
          const chore = state.chores[action.payload.choreId];
          if (chore && chore.subtasks) {
            const index = chore.subtasks.findIndex(
              (sub) => sub.id === action.payload.id
            );
            if (index !== -1) {
              chore.subtasks[index] = action.payload;
            }
          }
        }
      )
      .addCase(updateSubtask.rejected, (state, action) => {
        state.isLoading.updateSubtask = false;
        state.error = action.payload || "Failed to update subtask";
      })

      // Delete Subtask
      .addCase(deleteSubtask.pending, (state) => {
        state.isLoading.deleteSubtask = true;
        state.error = null;
      })
      .addCase(
        deleteSubtask.fulfilled,
        (
          state,
          action: PayloadAction<{ choreId: string; subtaskId: string }>
        ) => {
          state.isLoading.deleteSubtask = false;
          const { choreId, subtaskId } = action.payload;
          const chore = state.chores[choreId];
          if (chore && chore.subtasks) {
            chore.subtasks = chore.subtasks.filter(
              (sub) => sub.id !== subtaskId
            );
          }
        }
      )
      .addCase(deleteSubtask.rejected, (state, action) => {
        state.isLoading.deleteSubtask = false;
        state.error = action.payload || "Failed to delete subtask";
      })

      // Request Chore Swap
      .addCase(requestChoreSwap.pending, (state) => {
        state.isLoading.requestChoreSwap = true;
        state.error = null;
      })
      .addCase(
        requestChoreSwap.fulfilled,
        (state, action: PayloadAction<ChoreSwapRequest>) => {
          state.isLoading.requestChoreSwap = false;
          const chore = state.chores[action.payload.choreId];
          if (chore) {
            chore.swapRequests = [
              ...(chore.swapRequests || []),
              action.payload,
            ];
          }
        }
      )
      .addCase(requestChoreSwap.rejected, (state, action) => {
        state.isLoading.requestChoreSwap = false;
        state.error = action.payload || "Failed to request chore swap";
      })

      // Approve Chore Swap
      .addCase(approveChoreSwap.pending, (state) => {
        state.isLoading.approveChoreSwap = true;
        state.error = null;
      })
      .addCase(
        approveChoreSwap.fulfilled,
        (state, action: PayloadAction<Chore>) => {
          state.isLoading.approveChoreSwap = false;
          state.chores[action.payload.id] = action.payload;
        }
      )
      .addCase(approveChoreSwap.rejected, (state, action) => {
        state.isLoading.approveChoreSwap = false;
        state.error = action.payload || "Failed to approve chore swap";
      });
  },
});

export const { resetError } = choresSlice.actions;

// Memoized selectors
export const selectChoresState = (state: RootState) => state.chores;

export const selectChores = createSelector([selectChoresState], (choresState) =>
  Object.values(choresState.chores)
);

export const selectChoreById = createSelector(
  [selectChoresState, (state, choreId: string) => choreId],
  (choresState, choreId) => choresState.chores[choreId]
);

export const selectSubtasksByChoreId = createSelector(
  [selectChoreById],
  (chore) => chore?.subtasks || []
);

export const selectChoresLoading = createSelector(
  [selectChoresState],
  (choresState) => choresState.isLoading
);

export const selectChoresError = createSelector(
  [selectChoresState],
  (choresState) => choresState.error
);

export default choresSlice.reducer;
