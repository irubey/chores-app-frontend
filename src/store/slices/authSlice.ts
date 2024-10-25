import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import { User } from "@shared/types";
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

export const login = createAsyncThunk<
  User,
  { email: string; password: string }
>("auth/login", async (credentials) => {
  return await apiClient.auth.login(credentials);
});

export const register = createAsyncThunk<
  User,
  { email: string; password: string; name: string }
>("auth/register", async (userData) => {
  return await apiClient.auth.register(userData);
});

export const logout = createAsyncThunk<void, void>("auth/logout", async () => {
  try {
    await apiClient.auth.logout();
  } finally {
    // Always cleanup even if logout fails
    apiClient.cleanup();
  }
});

export const initializeAuth = createAsyncThunk<User | null>(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      return await apiClient.auth.initializeAuth();
    } catch (error) {
      if (error?.response?.status === 401) {
        apiClient.cleanup();
        return null;
      }
      return rejectWithValue("Failed to initialize authentication.");
    }
  }
);

export const refreshAuth = createAsyncThunk<User>(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.auth.refreshToken();
      return await apiClient.user.getProfile();
    } catch (error) {
      // Cleanup on refresh failure
      apiClient.cleanup();
      return rejectWithValue("Session expired. Please login again.");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.user = null;
      state.status = "idle";
      state.error = null;
      state.isAuthenticated = false;
      // Cleanup API client state when resetting auth
      apiClient.cleanup();
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Cases
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Login failed";
        state.user = null;
        state.isAuthenticated = false;
        // Cleanup on login failure
        apiClient.cleanup();
      })
      // Register Cases
      .addCase(register.pending, (state) => {
        state.status = "loading";
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Registration failed";
        state.user = null;
        state.isAuthenticated = false;
      })
      // Logout Cases
      .addCase(logout.pending, (state) => {
        state.status = "loading";
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = "succeeded";
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Logout failed";
        // Still reset auth state even if logout fails
        state.user = null;
        state.isAuthenticated = false;
      })
      // Initialize Auth Cases
      .addCase(initializeAuth.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Auth initialization failed";
        state.user = null;
        state.isAuthenticated = false;
      })
      // Refresh Auth Cases
      .addCase(refreshAuth.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(refreshAuth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshAuth.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Token refresh failed";
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
export const selectAuth = (state: RootState) => state.auth;
