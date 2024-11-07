import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import {
  Household,
  HouseholdMember,
  HouseholdMemberWithUser,
  UpdateHouseholdDTO,
} from "@shared/types";
import { apiClient } from "../../lib/api/apiClient";
import { AddMemberDTO } from "@shared/types";
import { ApiError } from "../../lib/api/errors";
import { HouseholdRole } from "@shared/enums";

interface HouseholdState {
  userHouseholds: Household[];
  selectedHouseholds: Household[];
  selectedMembers: HouseholdMemberWithUser[];
  currentHousehold: Household | null;
  members: HouseholdMember[];
  status: {
    list: "idle" | "loading" | "succeeded" | "failed";
    create: "idle" | "loading" | "succeeded" | "failed";
    update: "idle" | "loading" | "succeeded" | "failed";
    delete: "idle" | "loading" | "succeeded" | "failed";
    member: "idle" | "loading" | "succeeded" | "failed";
    invitation: "idle" | "loading" | "succeeded" | "failed";
  };
  error: string | null;
}

const initialState: HouseholdState = {
  userHouseholds: [],
  selectedHouseholds: [],
  selectedMembers: [],
  currentHousehold: null,
  members: [],
  status: {
    list: "idle",
    create: "idle",
    update: "idle",
    delete: "idle",
    member: "idle",
    invitation: "idle",
  },
  error: null,
};

// Async Thunks

// Fetch all households for the user
export const fetchUserHouseholds = createAsyncThunk<
  Household[],
  void,
  { state: RootState; rejectValue: string }
>("household/fetchUserHouseholds", async (_, thunkAPI) => {
  try {
    const households = await apiClient.households.getUserHouseholds();
    return households;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.message || "Failed to fetch households"
    );
  }
});

//Fetch one household
export const fetchHousehold = createAsyncThunk<
  Household,
  string,
  { rejectValue: string }
>("household/fetchHousehold", async (householdId, thunkAPI) => {
  try {
    const household = await apiClient.households.getHousehold(householdId);
    return household;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.message || "Failed to fetch household"
    );
  }
});

// Fetch members of a specific household
export const fetchHouseholdMembers = createAsyncThunk<
  HouseholdMember[],
  string,
  { rejectValue: string }
>("household/fetchHouseholdMembers", async (householdId, thunkAPI) => {
  try {
    const members = await apiClient.households.members.getMembers(householdId);
    return members;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to fetch members");
  }
});

// Invite a new member to a household
export const inviteMember = createAsyncThunk<
  HouseholdMember,
  { householdId: string; email: string },
  { rejectValue: string }
>("household/inviteMember", async ({ householdId, email }, thunkAPI) => {
  try {
    const invitedMember = await apiClient.households.members.addMember(
      householdId,
      {
        email,
        role: HouseholdRole.MEMBER,
      }
    );
    return invitedMember;
  } catch (error: any) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to invite member");
  }
});

// Remove a member from a household
export const removeMember = createAsyncThunk<
  string,
  { householdId: string; memberId: string },
  { rejectValue: string }
>("household/removeMember", async ({ householdId, memberId }, thunkAPI) => {
  try {
    await apiClient.households.members.removeMember(householdId, memberId);
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
    const newHousehold = await apiClient.households.createHousehold({
      name,
      currency,
      timezone: "UTC",
      language: "en",
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
    await apiClient.households.deleteHousehold(householdId);
    return householdId;
  } catch (error: any) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to delete household");
  }
});

// Update household details
export const updateHousehold = createAsyncThunk<
  Household,
  { householdId: string; data: UpdateHouseholdDTO },
  { rejectValue: string }
>("household/updateHousehold", async ({ householdId, data }, thunkAPI) => {
  try {
    const updatedHousehold = await apiClient.households.updateHousehold(
      householdId,
      data
    );
    return updatedHousehold;
  } catch (error: any) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to update household");
  }
});

// Update Member Status
export const updateMemberInvitationStatus = createAsyncThunk<
  HouseholdMember,
  { householdId: string; memberId: string; accept: boolean },
  { rejectValue: string }
>(
  "household/updateMemberInvitationStatus",
  async ({ householdId, memberId, accept }, thunkAPI) => {
    try {
      const updatedMember =
        await apiClient.households.invitations.updateMemberInvitationStatus(
          householdId,
          memberId,
          accept
        );
      return updatedMember;
    } catch (error: any) {
      if (error instanceof ApiError) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue(
        "Failed to update member invitation status"
      );
    }
  }
);

// Fetch Selected Households
export const fetchSelectedHouseholds = createAsyncThunk<
  HouseholdMemberWithUser[],
  void,
  { rejectValue: string }
>("household/fetchSelectedHouseholds", async (_, thunkAPI) => {
  try {
    const selectedMembers = await apiClient.households.getSelectedHouseholds();
    return selectedMembers;
  } catch (error: any) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to fetch selected households");
  }
});

// Update Selected Households
export const updateSelectedHouseholds = createAsyncThunk<
  HouseholdMember,
  { householdId: string; memberId: string; isSelected: boolean },
  { rejectValue: string }
>(
  "household/updateSelectedHouseholds",
  async ({ householdId, memberId, isSelected }, thunkAPI) => {
    try {
      const updatedMember = await apiClient.households.members.updateSelection(
        householdId,
        memberId,
        isSelected
      );
      return updatedMember;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Update selected households failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Toggle Household Selection
export const toggleHouseholdSelection = createAsyncThunk<
  HouseholdMember,
  { householdId: string; memberId: string; isSelected: boolean },
  { rejectValue: string }
>(
  "household/toggleSelection",
  async ({ householdId, memberId, isSelected }, thunkAPI) => {
    try {
      const updatedMember = await apiClient.households.members.updateSelection(
        householdId,
        memberId,
        isSelected
      );
      return updatedMember;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to update selection"
      );
    }
  }
);

// Update Member Role
export const updateMemberRole = createAsyncThunk<
  HouseholdMember,
  { householdId: string; memberId: string; role: HouseholdRole },
  { rejectValue: string }
>(
  "household/updateMemberRole",
  async ({ householdId, memberId, role }, thunkAPI) => {
    try {
      const updatedMember = await apiClient.households.members.updateMemberRole(
        householdId,
        memberId,
        role
      );
      return updatedMember;
    } catch (error: any) {
      if (error instanceof ApiError) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue("Failed to update member role");
    }
  }
);

export const addMember = createAsyncThunk<
  HouseholdMember,
  { householdId: string; data: AddMemberDTO },
  { rejectValue: string }
>("household/addMember", async ({ householdId, data }, thunkAPI) => {
  try {
    const member = await apiClient.households.members.addMember(
      householdId,
      data
    );
    return member;
  } catch (error: any) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to add member");
  }
});

export const getInvitations = createAsyncThunk<
  HouseholdMember[],
  void,
  { rejectValue: string }
>("household/getInvitations", async (_, thunkAPI) => {
  try {
    const invitations = await apiClient.households.invitations.getInvitations();
    return invitations;
  } catch (error: any) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to fetch invitations");
  }
});

// Send invitation
export const sendInvitation = createAsyncThunk<
  void,
  { householdId: string; email: string },
  { rejectValue: string }
>("household/sendInvitation", async ({ householdId, email }, thunkAPI) => {
  try {
    await apiClient.households.invitations.sendInvitation(householdId, email);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to send invitation");
  }
});

const householdSlice = createSlice({
  name: "household",
  initialState,
  reducers: {
    reset: (state) => {
      return initialState;
    },
    setCurrentHousehold: (state, action: PayloadAction<Household>) => {
      const household = state.userHouseholds.find(
        (h) => h.id === action.payload.id
      );
      if (household) {
        state.currentHousehold = household;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Households Cases
      .addCase(fetchUserHouseholds.pending, (state) => {
        state.status.list = "loading";
        state.error = null;
      })
      .addCase(fetchUserHouseholds.fulfilled, (state, action) => {
        state.status.list = "succeeded";
        state.userHouseholds = action.payload;
        state.error = null;
      })
      .addCase(fetchUserHouseholds.rejected, (state, action) => {
        state.status.list = "failed";
        state.error = action.payload || "Failed to fetch households";
      })
      // Update Member Invitation Status
      .addCase(updateMemberInvitationStatus.pending, (state) => {
        state.status.member = "loading";
        state.error = null;
      })
      .addCase(updateMemberInvitationStatus.fulfilled, (state, action) => {
        state.status.member = "succeeded";
        const index = state.members.findIndex(
          (m) => m.id === action.payload.id
        );
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      })
      .addCase(updateMemberInvitationStatus.rejected, (state, action) => {
        state.status.member = "failed";
        state.error = action.payload || "Failed to update member status";
      })

      // Add Member
      .addCase(addMember.pending, (state) => {
        state.status.member = "loading";
        state.error = null;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.status.member = "succeeded";
        state.members.push(action.payload);
      })
      .addCase(addMember.rejected, (state, action) => {
        state.status.member = "failed";
        state.error = action.payload || "Failed to add member";
      })

      // Get Household Details
      .addCase(fetchHousehold.pending, (state) => {
        state.status.list = "loading";
        state.error = null;
      })
      .addCase(fetchHousehold.fulfilled, (state, action) => {
        state.status.list = "succeeded";
        state.currentHousehold = action.payload;
        const index = state.userHouseholds.findIndex(
          (h) => h.id === action.payload.id
        );
        if (index !== -1) {
          state.userHouseholds[index] = action.payload;
        }
      })
      .addCase(fetchHousehold.rejected, (state, action) => {
        state.status.list = "failed";
        state.error = action.payload || "Failed to fetch household details";
      })

      // Get Invitations
      .addCase(getInvitations.pending, (state) => {
        state.status.invitation = "loading";
        state.error = null;
      })
      .addCase(getInvitations.fulfilled, (state, action) => {
        state.status.invitation = "succeeded";
        // Store invitations in a separate state property if needed
      })
      .addCase(getInvitations.rejected, (state, action) => {
        state.status.invitation = "failed";
        state.error = action.payload || "Failed to fetch invitations";
      })

      // Send Invitation
      .addCase(sendInvitation.pending, (state) => {
        state.status.invitation = "loading";
        state.error = null;
      })
      .addCase(sendInvitation.fulfilled, (state) => {
        state.status.invitation = "succeeded";
      })
      .addCase(sendInvitation.rejected, (state, action) => {
        state.status.invitation = "failed";
        state.error = action.payload || "Failed to send invitation";
      })

      // Selected Households Cases
      .addCase(fetchSelectedHouseholds.pending, (state) => {
        state.status.list = "loading";
      })
      .addCase(fetchSelectedHouseholds.fulfilled, (state, action) => {
        state.status.list = "succeeded";
        state.selectedMembers = action.payload;
        state.selectedHouseholds = action.payload
          .map((member) => member.household)
          .filter(
            (household): household is Household => household !== undefined
          );
      })
      .addCase(fetchSelectedHouseholds.rejected, (state, action) => {
        state.status.list = "failed";
        state.error = action.payload || "Failed to fetch selected households";
      })

      // Toggle Selection Cases
      .addCase(toggleHouseholdSelection.pending, (state) => {
        state.status.member = "loading";
      })
      .addCase(toggleHouseholdSelection.fulfilled, (state, action) => {
        state.status.member = "succeeded";
        const index = state.members.findIndex(
          (m) => m.id === action.payload.id
        );
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      })
      .addCase(toggleHouseholdSelection.rejected, (state, action) => {
        state.status.member = "failed";
        state.error = action.payload || "Failed to update selection";
      });
  },
});

// Export Actions
export const { reset, setCurrentHousehold } = householdSlice.actions;

// Export Selectors
export const selectHousehold = (state: RootState) => state.household;
export const selectUserHouseholds = (state: RootState) =>
  state.household.userHouseholds;
export const selectSelectedHouseholds = (state: RootState) =>
  state.household.selectedHouseholds;
export const selectSelectedMembers = (state: RootState) =>
  state.household.selectedMembers;
export const selectCurrentHousehold = (state: RootState) =>
  state.household.currentHousehold;
export const selectHouseholdMembers = (state: RootState) =>
  state.household.members;
export const selectHouseholdStatus = (state: RootState) =>
  state.household.status;
export const selectHouseholdError = (state: RootState) => state.household.error;

// Export Reducer
export default householdSlice.reducer;
