import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Household, HouseholdMember } from "../../types/household";
import { apiClient } from "../../lib/apiClient";

interface HouseholdState {
  userHouseholds: Household[];
  currentHousehold: Household | null;
  members: HouseholdMember[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: HouseholdState = {
  userHouseholds: [],
  currentHousehold: null,
  members: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

// Async Thunks

// Fetch all households for the user
export const fetchUserHouseholds = createAsyncThunk<
  Household[],
  void,
  { rejectValue: string }
>("household/fetchUserHouseholds", async (_, thunkAPI) => {
  try {
    const households = await apiClient.household.getHouseholds();
    return households;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Fetch user households failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Fetch members of a specific household
export const fetchHouseholdMembers = createAsyncThunk<
  HouseholdMember[],
  string,
  { rejectValue: string }
>("household/fetchHouseholdMembers", async (householdId, thunkAPI) => {
  try {
    const members = await apiClient.household.getHouseholdMembers(householdId);
    return members;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Fetch household members failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Invite a new member to a household
export const inviteMember = createAsyncThunk<
  HouseholdMember,
  { householdId: string; email: string },
  { rejectValue: string }
>("household/inviteMember", async ({ householdId, email }, thunkAPI) => {
  try {
    const invitedMember = await apiClient.household.members.inviteMember(
      householdId,
      email
    );
    return invitedMember;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Invite member failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Remove a member from a household
export const removeMember = createAsyncThunk<
  string,
  { householdId: string; memberId: string },
  { rejectValue: string }
>("household/removeMember", async ({ householdId, memberId }, thunkAPI) => {
  try {
    await apiClient.household.members.removeMember(householdId, memberId);
    return memberId;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Remove member failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Create a new household
export const createHousehold = createAsyncThunk<
  Household,
  { name: string; currency: string },
  { rejectValue: string }
>("household/createHousehold", async ({ name, currency }, thunkAPI) => {
  try {
    const newHousehold = await apiClient.household.createHousehold({
      name,
    });
    return newHousehold;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Create household failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Delete a household
export const deleteHousehold = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("household/deleteHousehold", async (householdId, thunkAPI) => {
  try {
    await apiClient.household.deleteHousehold(householdId);
    return householdId;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Delete household failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Update household details
export const updateHousehold = createAsyncThunk<
  Household,
  { householdId: string; data: Partial<Omit<Household, "id" | "members">> },
  { rejectValue: string }
>("household/updateHousehold", async ({ householdId, data }, thunkAPI) => {
  try {
    const updatedHousehold = await apiClient.household.updateHousehold(
      householdId,
      data
    );
    return updatedHousehold;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Update household failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Update Member Status
export const updateMemberStatus = createAsyncThunk<
  HouseholdMember,
  { householdId: string; memberId: string; status: "ACCEPTED" | "REJECTED" },
  { rejectValue: string }
>(
  "household/updateMemberStatus",
  async ({ householdId, memberId, status }, thunkAPI) => {
    try {
      const updatedMember = await apiClient.household.updateMemberStatus(
        householdId,
        memberId,
        status
      );
      return updatedMember;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Update member status failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch Selected Households
export const fetchSelectedHouseholds = createAsyncThunk<
  Household[],
  void,
  { rejectValue: string }
>("household/fetchSelectedHouseholds", async (_, thunkAPI) => {
  try {
    const selectedHouseholds =
      await apiClient.household.getSelectedHouseholds();
    return selectedHouseholds;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Fetch selected households failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Toggle Household Selection
export const toggleHouseholdSelection = createAsyncThunk<
  HouseholdMember,
  { householdId: string; memberId: string; isSelected: boolean },
  { rejectValue: string }
>(
  "household/toggleHouseholdSelection",
  async ({ householdId, memberId, isSelected }, thunkAPI) => {
    try {
      const updatedMember = await apiClient.household.toggleHouseholdSelection(
        householdId,
        memberId,
        isSelected
      );
      return updatedMember;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Toggle household selection failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Accept Invitation
export const acceptInvitation = createAsyncThunk<
  Household,
  { token: string },
  { rejectValue: string }
>("household/acceptInvitation", async ({ token }, thunkAPI) => {
  try {
    const household = await apiClient.household.members.acceptInvitation(token);
    return household;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Accept invitation failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Update Member Role
export const updateMemberRole = createAsyncThunk<
  HouseholdMember,
  { householdId: string; memberId: string; role: "ADMIN" | "MEMBER" },
  { rejectValue: string }
>(
  "household/updateMemberRole",
  async ({ householdId, memberId, role }, thunkAPI) => {
    try {
      const updatedMember = await apiClient.household.members.updateMemberRole(
        householdId,
        memberId,
        role
      );
      return updatedMember;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Update member role failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const householdSlice = createSlice({
  name: "household",
  initialState,
  reducers: {
    reset: (state) => {
      state.userHouseholds = [];
      state.currentHousehold = null;
      state.members = [];
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    setCurrentHousehold: (state, action: PayloadAction<Household>) => {
      state.currentHousehold = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Households
      .addCase(fetchUserHouseholds.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        fetchUserHouseholds.fulfilled,
        (state, action: PayloadAction<Household[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.userHouseholds = action.payload;
        }
      )
      .addCase(
        fetchUserHouseholds.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to fetch households";
        }
      )

      // Fetch Household Members
      .addCase(fetchHouseholdMembers.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        fetchHouseholdMembers.fulfilled,
        (state, action: PayloadAction<HouseholdMember[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.members = action.payload;
        }
      )
      .addCase(
        fetchHouseholdMembers.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to fetch household members";
        }
      )

      // Invite Member
      .addCase(inviteMember.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        inviteMember.fulfilled,
        (state, action: PayloadAction<HouseholdMember>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.members.push(action.payload);
        }
      )
      .addCase(
        inviteMember.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to invite member";
        }
      )

      // Remove Member
      .addCase(removeMember.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        removeMember.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.members = state.members.filter(
            (member) => member.id !== action.payload
          );
        }
      )
      .addCase(
        removeMember.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to remove member";
        }
      )

      // Create Household
      .addCase(createHousehold.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        createHousehold.fulfilled,
        (state, action: PayloadAction<Household>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.userHouseholds.push(action.payload);
          state.currentHousehold = action.payload;
        }
      )
      .addCase(
        createHousehold.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to create household";
        }
      )

      // Delete Household
      .addCase(deleteHousehold.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        deleteHousehold.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.userHouseholds = state.userHouseholds.filter(
            (household) => household.id !== action.payload
          );
          if (state.currentHousehold?.id === action.payload) {
            state.currentHousehold = null;
          }
        }
      )
      .addCase(
        deleteHousehold.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to delete household";
        }
      )

      // Update Household
      .addCase(updateHousehold.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        updateHousehold.fulfilled,
        (state, action: PayloadAction<Household>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.userHouseholds.findIndex(
            (h) => h.id === action.payload.id
          );
          if (index !== -1) {
            state.userHouseholds[index] = action.payload;
          }
          if (
            state.currentHousehold &&
            state.currentHousehold.id === action.payload.id
          ) {
            state.currentHousehold = action.payload;
          }
        }
      )
      .addCase(
        updateHousehold.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to update household";
        }
      )

      // Update Member Role
      .addCase(updateMemberRole.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        updateMemberRole.fulfilled,
        (state, action: PayloadAction<HouseholdMember>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.members.findIndex(
            (m) => m.id === action.payload.id
          );
          if (index !== -1) {
            state.members[index] = action.payload;
          }
        }
      )
      .addCase(
        updateMemberRole.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to update member role";
        }
      )

      // New Async Thunks Handlers

      // Update Member Status
      .addCase(updateMemberStatus.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        updateMemberStatus.fulfilled,
        (state, action: PayloadAction<HouseholdMember>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.members.findIndex(
            (m) => m.id === action.payload.id
          );
          if (index !== -1) {
            state.members[index] = action.payload;
          }
        }
      )
      .addCase(
        updateMemberStatus.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to update member status";
        }
      )

      // Fetch Selected Households
      .addCase(fetchSelectedHouseholds.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        fetchSelectedHouseholds.fulfilled,
        (state, action: PayloadAction<Household[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          // Assuming you want to handle selected households separately,
          // but since the state doesn't have a separate field,
          // you might need to adjust the state structure accordingly.
          state.userHouseholds = action.payload;
        }
      )
      .addCase(
        fetchSelectedHouseholds.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message =
            action.payload || "Failed to fetch selected households";
        }
      )

      // Toggle Household Selection
      .addCase(toggleHouseholdSelection.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        toggleHouseholdSelection.fulfilled,
        (state, action: PayloadAction<HouseholdMember>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.members.findIndex(
            (m) => m.id === action.payload.id
          );
          if (index !== -1) {
            state.members[index] = action.payload;
          }
        }
      )
      .addCase(
        toggleHouseholdSelection.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message =
            action.payload || "Failed to toggle household selection";
        }
      )

      // Accept Invitation
      .addCase(acceptInvitation.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        acceptInvitation.fulfilled,
        (state, action: PayloadAction<Household>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.userHouseholds.push(action.payload);
          state.currentHousehold = action.payload;
        }
      )
      .addCase(
        acceptInvitation.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Failed to accept invitation";
        }
      );
  },
});

// Export Actions
export const { reset, setCurrentHousehold } = householdSlice.actions;

// Export Selector
export const selectHousehold = (state: RootState) => state.household;

// Export Reducer
export default householdSlice.reducer;
