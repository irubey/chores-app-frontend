import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Household, HouseholdMember } from '../../types/household';
import { RootState } from '../store';
import { ApiResponse } from '../../types/api';

interface HouseholdState {
  households: Household[];
  currentHousehold: Household | null;
  members: HouseholdMember[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: HouseholdState = {
  households: [],
  currentHousehold: null,
  members: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Async thunks
export const fetchHouseholds = createAsyncThunk<
  Household[],
  void,
  { rejectValue: string }
>('household/fetchHouseholds', async (_, thunkAPI) => {
  try {
    const response = await apiClient.households.getHouseholds();
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch households';
    return thunkAPI.rejectWithValue(message);
  }
});

export const createHousehold = createAsyncThunk<
  Household,
  { name: string },
  { rejectValue: string }
>('household/createHousehold', async (data, thunkAPI) => {
  try {
    const response = await apiClient.households.createHousehold(data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to create household';
    return thunkAPI.rejectWithValue(message);
  }
});

export const fetchHouseholdDetails = createAsyncThunk<
  Household,
  string,
  { rejectValue: string }
>('household/fetchHouseholdDetails', async (householdId, thunkAPI) => {
  try {
    const response = await apiClient.households.getHousehold(householdId);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch household details';
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateHousehold = createAsyncThunk<
  Household,
  { householdId: string; data: Partial<Household> },
  { rejectValue: string }
>('household/updateHousehold', async ({ householdId, data }, thunkAPI) => {
  try {
    const response = await apiClient.households.updateHousehold(householdId, data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to update household';
    return thunkAPI.rejectWithValue(message);
  }
});

export const deleteHousehold = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('household/deleteHousehold', async (householdId, thunkAPI) => {
  try {
    await apiClient.households.deleteHousehold(householdId);
    return householdId;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to delete household';
    return thunkAPI.rejectWithValue(message);
  }
});

export const fetchHouseholdMembers = createAsyncThunk<
  HouseholdMember[],
  string,
  { rejectValue: string }
>('household/fetchHouseholdMembers', async (householdId, thunkAPI) => {
  try {
    const response = await apiClient.householdMembers.getMembers(householdId);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch household members';
    return thunkAPI.rejectWithValue(message);
  }
});

export const inviteHouseholdMember = createAsyncThunk<
  HouseholdMember,
  { householdId: string; email: string; role?: 'ADMIN' | 'MEMBER' },
  { rejectValue: string }
>('household/inviteHouseholdMember', async ({ householdId, email, role }, thunkAPI) => {
  try {
    const response = await apiClient.householdMembers.inviteMember(householdId, { email, role });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to invite household member';
    return thunkAPI.rejectWithValue(message);
  }
});

export const removeHouseholdMember = createAsyncThunk<
  { householdId: string; memberId: string },
  { householdId: string; memberId: string },
  { rejectValue: string }
>('household/removeHouseholdMember', async ({ householdId, memberId }, thunkAPI) => {
  try {
    await apiClient.householdMembers.removeMember(householdId, memberId);
    return { householdId, memberId };
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to remove household member';
    return thunkAPI.rejectWithValue(message);
  }
});

// Slice
const householdSlice = createSlice({
  name: 'household',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    setCurrentHousehold: (state, action: PayloadAction<Household>) => {
      state.currentHousehold = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Households
      .addCase(fetchHouseholds.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHouseholds.fulfilled, (state, action: PayloadAction<Household[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.households = action.payload;
      })
      .addCase(fetchHouseholds.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Create Household
      .addCase(createHousehold.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createHousehold.fulfilled, (state, action: PayloadAction<Household>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.households.push(action.payload);
      })
      .addCase(createHousehold.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Fetch Household Details
      .addCase(fetchHouseholdDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHouseholdDetails.fulfilled, (state, action: PayloadAction<Household>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentHousehold = action.payload;
      })
      .addCase(fetchHouseholdDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Update Household
      .addCase(updateHousehold.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateHousehold.fulfilled, (state, action: PayloadAction<Household>) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.households.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.households[index] = action.payload;
        }
        if (state.currentHousehold?.id === action.payload.id) {
          state.currentHousehold = action.payload;
        }
      })
      .addCase(updateHousehold.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Delete Household
      .addCase(deleteHousehold.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteHousehold.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.households = state.households.filter(h => h.id !== action.payload);
        if (state.currentHousehold?.id === action.payload) {
          state.currentHousehold = null;
        }
      })
      .addCase(deleteHousehold.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Fetch Household Members
      .addCase(fetchHouseholdMembers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHouseholdMembers.fulfilled, (state, action: PayloadAction<HouseholdMember[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.members = action.payload;
      })
      .addCase(fetchHouseholdMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Invite Household Member
      .addCase(inviteHouseholdMember.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(inviteHouseholdMember.fulfilled, (state, action: PayloadAction<HouseholdMember>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.members.push(action.payload);
      })
      .addCase(inviteHouseholdMember.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Remove Household Member
      .addCase(removeHouseholdMember.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(removeHouseholdMember.fulfilled, (state, action: PayloadAction<{ householdId: string; memberId: string }>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.members = state.members.filter(m => m.id !== action.payload.memberId);
      })
      .addCase(removeHouseholdMember.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const { reset, setCurrentHousehold } = householdSlice.actions;

export const selectHousehold = (state: RootState) => state.household;

export default householdSlice.reducer;


