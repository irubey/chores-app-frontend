import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Chore, CreateChoreDTO, UpdateChoreDTO } from '../../types/chore';
import { RootState } from '../store';

interface ChoresState {
  chores: Chore[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: ChoresState = {
  chores: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Async thunks
export const fetchChores = createAsyncThunk<Chore[], string, { rejectValue: string }>(
  'chores/fetchChores',
  async (householdId, thunkAPI) => {
    try {
      const response = await apiClient.chores.getChores(householdId);
      return response; // Assuming apiClient.chores.getChores returns Chore[]
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to fetch chores';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addChore = createAsyncThunk<Chore, { householdId: string; choreData: CreateChoreDTO }, { rejectValue: string }>(
  'chores/addChore',
  async ({ householdId, choreData }, thunkAPI) => {
    try {
      const response = await apiClient.chores.createChore(householdId, choreData);
      return response; // Assuming apiClient.chores.createChore returns Chore
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to add chore';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateChore = createAsyncThunk<Chore, { householdId: string; choreId: string; choreData: UpdateChoreDTO }, { rejectValue: string }>(
  'chores/updateChore',
  async ({ householdId, choreId, choreData }, thunkAPI) => {
    try {
      const response = await apiClient.chores.updateChore(householdId, choreId, choreData);
      return response; // Assuming apiClient.chores.updateChore returns Chore
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to update chore';
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
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to delete chore';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Slice
const choresSlice = createSlice({
  name: 'chores',
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
      // Fetch Chores
      .addCase(fetchChores.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchChores.fulfilled, (state, action: PayloadAction<Chore[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.chores = action.payload;
      })
      .addCase(fetchChores.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add Chore
      .addCase(addChore.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addChore.fulfilled, (state, action: PayloadAction<Chore>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.chores.push(action.payload);
      })
      .addCase(addChore.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update Chore
      .addCase(updateChore.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateChore.fulfilled, (state, action: PayloadAction<Chore>) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.chores.findIndex(chore => chore.id === action.payload.id);
        if (index !== -1) {
          state.chores[index] = action.payload;
        }
      })
      .addCase(updateChore.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete Chore
      .addCase(deleteChore.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteChore.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.chores = state.chores.filter(chore => chore.id !== action.payload);
      })
      .addCase(deleteChore.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = choresSlice.actions;

export const selectChores = (state: RootState) => state.chores;

export default choresSlice.reducer;
