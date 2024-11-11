import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/api/apiClient";
import { User } from "@shared/types";
import type { RootState } from "../store";
import { tokenService } from "../../lib/api/services/tokenService";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";
import { logger } from "@/lib/api/logger";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isAuthenticated: boolean;
}

interface ErrorResponse {
  message: string;
  status: number;
  type: ApiErrorType;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
  isAuthenticated: false,
};

export const login = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: ErrorResponse }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    logger.debug("Attempting login", { email: credentials.email });
    const response = await apiClient.auth.login(credentials);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        message: error.message,
        status: error.status,
        type: error instanceof ApiError ? error.type : ApiErrorType.UNKNOWN,
      });
    }
    return rejectWithValue({
      message: "Login failed - Please try again",
      status: 500,
      type: ApiErrorType.UNKNOWN,
    });
  }
});

export const register = createAsyncThunk<
  User,
  { email: string; password: string; name: string },
  { rejectValue: ErrorResponse }
>("auth/register", async (userData, { rejectWithValue }) => {
  try {
    logger.debug("Attempting registration", { email: userData.email });
    const response = await apiClient.auth.register(userData);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        message: error.message,
        status: error.status,
        type: error instanceof ApiError ? error.type : ApiErrorType.UNKNOWN,
      });
    }
    return rejectWithValue({
      message: "Registration failed - Please try again",
      status: 500,
      type: ApiErrorType.UNKNOWN,
    });
  }
});

export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: ErrorResponse }
>("auth/logout", async (_, { rejectWithValue }) => {
  try {
    logger.debug("Attempting logout");
    const response = await apiClient.auth.logout();
    tokenService.cleanup();
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        message: error.message,
        status: error.status,
        type: error instanceof ApiError ? error.type : ApiErrorType.UNKNOWN,
      });
    }
    return rejectWithValue({
      message: "Logout failed - Please try again",
      status: 500,
      type: ApiErrorType.UNKNOWN,
    });
  }
});

export const initializeAuth = createAsyncThunk<
  User | null,
  void,
  { rejectValue: ErrorResponse }
>("auth/initialize", async (_, { rejectWithValue }) => {
  try {
    logger.debug("Initializing auth state");
    const response = await apiClient.auth.initializeAuth();
    return response?.data ?? null;
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        message: error.message,
        status: error.status,
        type: error instanceof ApiError ? error.type : ApiErrorType.UNKNOWN,
      });
    }
    return rejectWithValue({
      message: "An unexpected error occurred",
      status: 500,
      type: ApiErrorType.UNKNOWN,
    });
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.user = null;
      state.status = "idle";
      state.error = null;
      state.isAuthenticated = false;
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
        logger.info("Login successful", { userId: action.payload.id });
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Login failed";
        state.user = null;
        state.isAuthenticated = false;
        logger.error("Login failed", { error: action.payload });
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
        logger.info("Registration successful", { userId: action.payload.id });
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Registration failed";
        state.user = null;
        state.isAuthenticated = false;
        logger.error("Registration failed", { error: action.payload });
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
        logger.info("Logout successful");
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Logout failed";
        state.user = null;
        state.isAuthenticated = false;
        logger.error("Logout failed", { error: action.payload });
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
        logger.info("Auth initialization successful", {
          isAuthenticated: !!action.payload,
        });
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload?.message === "Unauthorized"
            ? null
            : action.payload?.message || "Auth initialization failed";
        state.user = null;
        state.isAuthenticated = false;
        logger.error("Auth initialization failed", { error: action.payload });
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
export const selectAuth = (state: RootState) => state.auth;
