import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Chore, CreateChoreDTO, UpdateChoreDTO, Subtask, CreateSubtaskDTO, UpdateSubtaskDTO, ChoreSwapRequest } from '../../types/chore';
import { RootState } from '../store';

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

// Existing Thunks
export const fetchChores = createAsyncThunk<Chore[], string, { rejectValue: string }>(
  'chores/fetchChores',
  async (householdId, thunkAPI) => {
    try {
      const response = await apiClient.chores.getChores(householdId);
      return response;
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || 'Failed to fetch chores';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addChore = createAsyncThunk<Chore, { householdId: string; choreData: CreateChoreDTO }, { rejectValue: string }>(
  'chores/addChore',
  async ({ householdId, choreData }, thunkAPI) => {
    try {
      const response = await apiClient.chores.createChore(householdId, choreData);
      return response;
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || 'Failed to add chore';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateChore = createAsyncThunk<Chore, { householdId: string; choreId: string; choreData: UpdateChoreDTO }, { rejectValue: string }>(
  'chores/updateChore',
  async ({ householdId, choreId, choreData }, thunkAPI) => {
    try {
      const response = await apiClient.chores.updateChore(householdId, choreId, choreData);
      return response;
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || 'Failed to update chore';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteChore = createAsyncThunk<string, { householdId: string; choreId: string }, { rejectValue: string }>(
  'chores/deleteChore',
  async ({ householdId, choreId }, thunkAPI) => {
    try {
      await apiClient.chores.deleteChore(householdId, choreId);
      return choreId;
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || 'Failed to delete chore';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// New Thunks for Subtasks

/**
 * Add a new subtask to a chore.
 */
export const addSubtask = createAsyncThunk<Subtask, { householdId: string; choreId: string; subtaskData: CreateSubtaskDTO }, { rejectValue: string }>(
  'chores/addSubtask',
  async ({ householdId, choreId, subtaskData }, thunkAPI) => {
    try {
      const subtask = await apiClient.chores.subtasks.createSubtask(householdId, choreId, subtaskData);
      return subtask;
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || 'Failed to add subtask';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

/**
 * Update an existing subtask.
 */
export const updateSubtask = createAsyncThunk<Subtask, { householdId: string; choreId: string; subtaskId: string; subtaskData: UpdateSubtaskDTO }, { rejectValue: string }>(
  'chores/updateSubtask',
  async ({ householdId, choreId, subtaskId, subtaskData }, thunkAPI) => {
    try {
      const updatedSubtask = await apiClient.chores.subtasks.updateSubtask(householdId, choreId, subtaskId, subtaskData);
      return updatedSubtask;
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || 'Failed to update subtask';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

/**
 * Delete a subtask from a chore.
 */
export const deleteSubtask = createAsyncThunk<string, { householdId: string; choreId: string; subtaskId: string }, { rejectValue: string }>(
  'chores/deleteSubtask',
  async ({ householdId, choreId, subtaskId }, thunkAPI) => {
    try {
      await apiClient.chores.subtasks.deleteSubtask(householdId, choreId, subtaskId);
      return subtaskId;
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || 'Failed to delete subtask';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// New Thunks for Chore Swapping

export const requestChoreSwap = createAsyncThunk<
  ChoreSwapRequest,
  { householdId: string; choreId: string; targetUserId: string },
  { rejectValue: string }
>('chores/requestChoreSwap', async ({ householdId, choreId, targetUserId }, thunkAPI) => {
  try {
    const response = await apiClient.chores.requestChoreSwap(householdId, choreId, targetUserId);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to request chore swap');
  }
});

export const approveChoreSwap = createAsyncThunk<
  Chore,
  { householdId: string; choreId: string; swapRequestId: string; approved: boolean },
  { rejectValue: string }
>('chores/approveChoreSwap', async ({ householdId, choreId, swapRequestId, approved }, thunkAPI) => {
  try {
    const response = await apiClient.chores.approveChoreSwap(householdId, choreId, swapRequestId, approved);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to approve chore swap');
  }
});

// Slice
const choresSlice = createSlice({
  name: 'chores',
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
      .addCase(fetchChores.fulfilled, (state, action: PayloadAction<Chore[]>) => {
        state.isLoading.fetchChores = false;
        state.chores = action.payload.reduce((acc, chore) => {
          acc[chore.id] = chore;
          return acc;
        }, {} as ChoresState['chores']);
      })
      .addCase(fetchChores.rejected, (state, action) => {
        state.isLoading.fetchChores = false;
        state.error = action.payload || 'Failed to fetch chores';
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
        state.error = action.payload || 'Failed to add chore';
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
        state.error = action.payload || 'Failed to update chore';
      })
      
      // Delete Chore
      .addCase(deleteChore.pending, (state) => {
        state.isLoading.deleteChore = true;
        state.error = null;
      })
      .addCase(deleteChore.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading.deleteChore = false;
        delete state.chores[action.payload];
      })
      .addCase(deleteChore.rejected, (state, action) => {
        state.isLoading.deleteChore = false;
        state.error = action.payload || 'Failed to delete chore';
      })

      // Add Subtask
      .addCase(addSubtask.pending, (state) => {
        state.isLoading.createSubtask = true;
        state.error = null;
      })
      .addCase(addSubtask.fulfilled, (state, action: PayloadAction<Subtask>) => {
        state.isLoading.createSubtask = false;
        const chore = state.chores[action.payload.choreId];
        if (chore) {
          chore.subtasks = chore.subtasks ? [...chore.subtasks, action.payload] : [action.payload];
        }
      })
      .addCase(addSubtask.rejected, (state, action) => {
        state.isLoading.createSubtask = false;
        state.error = action.payload || 'Failed to add subtask';
      })

      // Update Subtask
      .addCase(updateSubtask.pending, (state) => {
        state.isLoading.updateSubtask = true;
        state.error = null;
      })
      .addCase(updateSubtask.fulfilled, (state, action: PayloadAction<Subtask>) => {
        state.isLoading.updateSubtask = false;
        const chore = state.chores[action.payload.choreId];
        if (chore && chore.subtasks) {
          const index = chore.subtasks.findIndex(sub => sub.id === action.payload.id);
          if (index !== -1) {
            chore.subtasks[index] = action.payload;
          }
        }
      })
      .addCase(updateSubtask.rejected, (state, action) => {
        state.isLoading.updateSubtask = false;
        state.error = action.payload || 'Failed to update subtask';
      })

      // Delete Subtask
      .addCase(deleteSubtask.pending, (state) => {
        state.isLoading.deleteSubtask = true;
        state.error = null;
      })
      .addCase(deleteSubtask.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading.deleteSubtask = false;
        // Find and remove the subtask from its chore
        Object.values(state.chores).forEach(chore => {
          if (chore.subtasks) {
            chore.subtasks = chore.subtasks.filter(sub => sub.id !== action.payload);
          }
        });
      })
      .addCase(deleteSubtask.rejected, (state, action) => {
        state.isLoading.deleteSubtask = false;
        state.error = action.payload || 'Failed to delete subtask';
      })

      // Request Chore Swap
      .addCase(requestChoreSwap.pending, (state) => {
        state.isLoading.requestChoreSwap = true;
        state.error = null;
      })
      .addCase(requestChoreSwap.fulfilled, (state, action: PayloadAction<ChoreSwapRequest>) => {
        state.isLoading.requestChoreSwap = false;
        // You might want to store swap requests in a separate part of the state
        // For now, we'll just add it to the chore
        const chore = state.chores[action.payload.choreId];
        if (chore) {
          chore.swapRequests = [...(chore.swapRequests || []), action.payload];
        }
      })
      .addCase(requestChoreSwap.rejected, (state, action) => {
        state.isLoading.requestChoreSwap = false;
        state.error = action.payload || 'Failed to request chore swap';
      })

      // Approve Chore Swap
      .addCase(approveChoreSwap.pending, (state) => {
        state.isLoading.approveChoreSwap = true;
        state.error = null;
      })
      .addCase(approveChoreSwap.fulfilled, (state, action: PayloadAction<Chore>) => {
        state.isLoading.approveChoreSwap = false;
        state.chores[action.payload.id] = action.payload;
      })
      .addCase(approveChoreSwap.rejected, (state, action) => {
        state.isLoading.approveChoreSwap = false;
        state.error = action.payload || 'Failed to approve chore swap';
      });
  },
});

export const { resetError } = choresSlice.actions;

// Memoized selectors
export const selectChoresState = (state: RootState) => state.chores;

export const selectChores = createSelector(
  [selectChoresState],
  (choresState) => Object.values(choresState.chores)
);

export const selectChoreById = createSelector(
  [selectChoresState, (state, choreId: string) => choreId],
  (choresState, choreId) => choresState.chores[choreId]
);

/**
 * Selector to get subtasks for a specific chore.
 * @param state - The root state.
 * @param choreId - The ID of the chore.
 * @returns An array of subtasks.
 */
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