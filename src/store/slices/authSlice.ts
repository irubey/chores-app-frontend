import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/api/apiClient";
import { User } from "@shared/types";
import type { RootState } from "../store";
import { tokenService } from "../../lib/api/services/tokenService";
import { ApiError } from "@/lib/api/errors";

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
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const user = await apiClient.auth.login(credentials);
    return user;
  } catch (error: any) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("Login failed");
  }
});

export const register = createAsyncThunk<
  User,
  { email: string; password: string; name: string }
>("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const user = await apiClient.auth.register(userData);
    return user;
  } catch (error: any) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("Registration failed");
  }
});

export const logout = createAsyncThunk<void, void>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.auth.logout();
      tokenService.cleanup();
    } catch (error: any) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Logout failed");
    }
  }
);

export const initializeAuth = createAsyncThunk<User | null>(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const user = await apiClient.user.getProfile();
      return user;
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }
      return rejectWithValue("Failed to initialize authentication.");
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
      tokenService.cleanup();
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
        state.error = (action.payload as string) || "Login failed";
        state.user = null;
        state.isAuthenticated = false;
      })
      // Register Cases
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Registration failed";
        state.user = null;
        state.isAuthenticated = false;
      })
      // Logout Cases
      .addCase(logout.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = "succeeded";
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Logout failed";
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
        state.error =
          (action.payload as string) || "Auth initialization failed";
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
export const selectAuth = (state: RootState) => state.auth;
