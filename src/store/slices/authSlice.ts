import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import { User } from "../../types/user";
import type { RootState } from "../store";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
  isAuthenticated: false,
};

// Async Thunks
export const login = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async (credentials, thunkAPI) => {
  try {
    const user = await apiClient.auth.login(credentials);
    return user;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Login failed";
    return thunkAPI.rejectWithValue(message);
  }
});

export const register = createAsyncThunk<
  User,
  { email: string; password: string; name: string },
  { rejectValue: string }
>("auth/register", async (userData, thunkAPI) => {
  try {
    const user = await apiClient.auth.register(userData);
    return user;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Registration failed";
    return thunkAPI.rejectWithValue(message);
  }
});

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      await apiClient.auth.logout();
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Logout failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const initializeAuth = createAsyncThunk<
  User | null,
  void,
  { rejectValue: string }
>("auth/initialize", async (_, thunkAPI) => {
  try {
    const user = await apiClient.auth.initializeAuth();
    return user;
  } catch (error: any) {
    return thunkAPI.rejectWithValue("Failed to initialize auth");
  }
});

// Revised refreshAuth Thunk
export const refreshAuth = createAsyncThunk<
  User | null,
  void,
  { rejectValue: string }
>("auth/refresh", async (_, thunkAPI) => {
  try {
    // Call the dedicated refresh-token endpoint
    await apiClient.auth.refreshToken();

    // After refreshing, fetch the updated user data
    const user = await apiClient.auth.initializeAuth();
    return user;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Token refresh failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Create Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Cases
      .addCase(login.pending, (state) => {
        state.status = "loading";
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Register Cases
      .addCase(register.pending, (state) => {
        state.status = "loading";
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Logout Cases
      .addCase(logout.pending, (state) => {
        state.status = "loading";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      // Initialize Auth Cases
      .addCase(initializeAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(
        initializeAuth.fulfilled,
        (state, action: PayloadAction<User | null>) => {
          state.status = "succeeded";
          state.user = action.payload;
          state.isAuthenticated = !!action.payload;
          state.error = null;
        }
      )
      .addCase(initializeAuth.rejected, (state) => {
        state.status = "failed";
        state.user = null;
        state.isAuthenticated = false;
      })
      // Refresh Auth Cases
      .addCase(refreshAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(
        refreshAuth.fulfilled,
        (state, action: PayloadAction<User | null>) => {
          state.status = "succeeded";
          state.user = action.payload;
          state.isAuthenticated = !!action.payload;
          state.error = null;
        }
      )
      .addCase(refreshAuth.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

// Export Actions
export const { reset } = authSlice.actions;

// Export Reducer
export default authSlice.reducer;

// Export the `selectAuth` Selector
export const selectAuth = (state: RootState) => state.auth;
