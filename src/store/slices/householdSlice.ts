import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Household, HouseholdMember } from '../../types/household';
import { RootState } from '../store';
import { GetUserHouseholdsResponse, InviteMemberResponse } from '../../types/api';

interface HouseholdState {
  userHouseholds: Household[];
  currentHousehold: Household | null;
  members: HouseholdMember[];
  selectedHouseholds: Household[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: HouseholdState = {
  userHouseholds: [],
  currentHousehold: null,
  members: [],
  selectedHouseholds: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

export const fetchUserHouseholds = createAsyncThunk<
  Household[],
  void,
  { rejectValue: string }
>('household/fetchUserHouseholds', async (_, thunkAPI) => {
  try {
    const response = await apiClient.households.getUserHouseholds();
    return response;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch user households';
    return thunkAPI.rejectWithValue(message);
  }
});

export const getHousehold = createAsyncThunk<
  Household,
  string,
  { rejectValue: string }
>('household/getHousehold', async (householdId, thunkAPI) => {
  try {
    const response = await apiClient.households.getHousehold(householdId);
    return response;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch household';
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
    return response;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to create household';
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
    return response;
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

export const fetchSelectedHouseholds = createAsyncThunk<
  Household[],
  void,
  { rejectValue: string }
>('household/fetchSelectedHouseholds', async (_, thunkAPI) => {
  try {
    const response = await apiClient.households.getSelectedHouseholds();
    return response;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch selected households';
    return thunkAPI.rejectWithValue(message);
  }
});

export const toggleHouseholdSelection = createAsyncThunk<
  HouseholdMember,
  { householdId: string; isSelected: boolean },
  { rejectValue: string }
>('household/toggleHouseholdSelection', async ({ householdId, isSelected }, thunkAPI) => {
  try {
    const response = await apiClient.households.toggleHouseholdSelection(householdId, isSelected);
    return response;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to toggle household selection';
    return thunkAPI.rejectWithValue(message);
  }
});

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
      // Fetch User Households
      .addCase(fetchUserHouseholds.pending, setPending)
      .addCase(fetchUserHouseholds.fulfilled, (state, action: PayloadAction<Household[]>) => {
        setFulfilled(state);
        state.userHouseholds = action.payload;
      })
      .addCase(fetchUserHouseholds.rejected, setRejected)
      
      // Get Household
      .addCase(getHousehold.pending, setPending)
      .addCase(getHousehold.fulfilled, (state, action: PayloadAction<Household>) => {
        setFulfilled(state);
        state.currentHousehold = action.payload;
      })
      .addCase(getHousehold.rejected, setRejected)
      
      // Create Household
      .addCase(createHousehold.pending, setPending)
      .addCase(createHousehold.fulfilled, (state, action: PayloadAction<Household>) => {
        setFulfilled(state);
        state.userHouseholds.push(action.payload);
      })
      .addCase(createHousehold.rejected, setRejected)
      
      // Update Household
      .addCase(updateHousehold.pending, setPending)
      .addCase(updateHousehold.fulfilled, (state, action: PayloadAction<Household>) => {
        setFulfilled(state);
        const index = state.userHouseholds.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.userHouseholds[index] = action.payload;
        }
        if (state.currentHousehold?.id === action.payload.id) {
          state.currentHousehold = action.payload;
        }
      })
      .addCase(updateHousehold.rejected, setRejected)
      
      // Delete Household
      .addCase(deleteHousehold.pending, setPending)
      .addCase(deleteHousehold.fulfilled, (state, action: PayloadAction<string>) => {
        setFulfilled(state);
        state.userHouseholds = state.userHouseholds.filter(h => h.id !== action.payload);
        if (state.currentHousehold?.id === action.payload) {
          state.currentHousehold = null;
        }
      })
      .addCase(deleteHousehold.rejected, setRejected)
      
      // Fetch Household Members
      .addCase(fetchHouseholdMembers.pending, setPending)
      .addCase(fetchHouseholdMembers.fulfilled, (state, action: PayloadAction<HouseholdMember[]>) => {
        setFulfilled(state);
        state.members = action.payload;
      })
      .addCase(fetchHouseholdMembers.rejected, setRejected)
      
      // Invite Household Member
      .addCase(inviteHouseholdMember.pending, setPending)
      .addCase(inviteHouseholdMember.fulfilled, (state, action: PayloadAction<HouseholdMember>) => {
        setFulfilled(state);
        state.members.push(action.payload);
      })
      .addCase(inviteHouseholdMember.rejected, setRejected)
      
      // Remove Household Member
      .addCase(removeHouseholdMember.pending, setPending)
      .addCase(removeHouseholdMember.fulfilled, (state, action: PayloadAction<{ householdId: string; memberId: string }>) => {
        setFulfilled(state);
        state.members = state.members.filter(m => m.id !== action.payload.memberId);
      })
      .addCase(removeHouseholdMember.rejected, setRejected)
      
      // Fetch Selected Households
      .addCase(fetchSelectedHouseholds.pending, setPending)
      .addCase(fetchSelectedHouseholds.fulfilled, (state, action: PayloadAction<Household[]>) => {
        setFulfilled(state);
        // Assuming you have a separate state field for selectedHouseholds
        state.selectedHouseholds = action.payload;
      })
      .addCase(fetchSelectedHouseholds.rejected, setRejected)
      
      // Toggle Household Selection
      .addCase(toggleHouseholdSelection.pending, setPending)
      .addCase(toggleHouseholdSelection.fulfilled, (state, action: PayloadAction<HouseholdMember>) => {
        setFulfilled(state);
        // Update the members list with the new isSelected status
        const index = state.members.findIndex(m => m.userId === action.payload.userId && m.householdId === action.payload.householdId);
        if (index !== -1) {
          state.members[index].isSelected = action.payload.isSelected;
        }
        // Optionally, update selectedHouseholds based on isSelected
        if (action.payload.isSelected) {
          const household = state.userHouseholds.find(h => h.id === action.payload.householdId);
          if (household && !state.selectedHouseholds.find(sh => sh.id === household.id)) {
            state.selectedHouseholds.push(household);
          }
        } else {
          state.selectedHouseholds = state.selectedHouseholds.filter(sh => sh.id !== action.payload.householdId);
        }
      })
      .addCase(toggleHouseholdSelection.rejected, setRejected);
  },
});

function setPending(state: HouseholdState) {
  state.isLoading = true;
  state.isSuccess = false;
  state.isError = false;
  state.message = '';
}

function setFulfilled(state: HouseholdState) {
  state.isLoading = false;
  state.isSuccess = true;
  state.isError = false;
  state.message = '';
}

function setRejected(state: HouseholdState, action: PayloadAction<string>) {
  state.isLoading = false;
  state.isSuccess = false;
  state.isError = true;
  state.message = action.payload;
}

export const { reset, setCurrentHousehold } = householdSlice.actions;

export const selectHousehold = (state: RootState) => state.household;

export const selectSelectedHouseholds = (state: RootState) => state.household.selectedHouseholds;

export default householdSlice.reducer;