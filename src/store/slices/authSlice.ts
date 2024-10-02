import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { User } from '../../types/user';
import type { RootState } from '../store';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: null,
  isAuthenticated: false,
  isInitialized: false,
};

// Async Thunks
export const login = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const user = await apiClient.auth.login(credentials);
      return user;
    } catch (error: any) {
      const message = error.message || 'Login failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk<
  User,
  { email: string; password: string; name: string },
  { rejectValue: string }
>(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      const user = await apiClient.auth.register(userData);
      return user;
    } catch (error: any) {
      const message = error.message || 'Registration failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      await apiClient.auth.logout();
    } catch (error: any) {
      const message = error.message || 'Logout failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const initializeAuth = createAsyncThunk<
  User | null,
  void,
  { rejectValue: string }
>(
  'auth/initialize',
  async (_, thunkAPI) => {
    try {
      const user = await apiClient.auth.initializeAuth();
      return user;
    } catch (error: any) {
      return thunkAPI.rejectWithValue('Failed to initialize auth');
    }
  }
);

// Create Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = null;
    },
    updateAuthState: (state, action: PayloadAction<{ isAuthenticated: boolean; isInitialized: boolean }>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.isInitialized = action.payload.isInitialized;
      if (!action.payload.isAuthenticated) {
        state.user = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Register Cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Logout Cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload as string;
      })
      // Initialize Auth Cases
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.isInitialized = true;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
      });
  },
});

// Export Actions
export const { reset, updateAuthState } = authSlice.actions;

// Export Reducer
export default authSlice.reducer;

// Export the `selectAuth` Selector
export const selectAuth = (state: RootState) => state.auth;