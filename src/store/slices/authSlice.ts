import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { User } from '../../types/user';
import { LoginResponse, RegisterResponse } from '../../types/api';
import type { RootState } from '../store';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // New flag
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: null,
  isAuthenticated: false,
  isInitialized: false, // Initialize as false
};

// Async Thunks
export const login = createAsyncThunk<
  LoginResponse,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const response = await apiClient.auth.login(credentials);
      // Set the access token in a cookie
      Cookies.set('accessToken', response.accessToken, { secure: true, sameSite: 'strict' });
      return response;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'Login failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk<
  RegisterResponse,
  { email: string; password: string; name: string },
  { rejectValue: string }
>(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      const response = await apiClient.auth.register(userData);
      return response;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.error) ||
        error.message ||
        'Registration failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      await apiClient.auth.logout();
      // Clear the access token cookie
      Cookies.remove('accessToken');
      return;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'Logout failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add a new action to initialize auth state
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
      Cookies.remove('accessToken');
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
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
    },
    updateAuthState: (state, action: PayloadAction<{ isAuthenticated: boolean; isInitialized: boolean }>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.isInitialized = action.payload.isInitialized;
      if (!action.payload.isAuthenticated) {
        state.user = null;
        state.accessToken = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })
      // Register Cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<RegisterResponse>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })
      // Logout Cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
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
        state.accessToken = Cookies.get('accessToken') || null;
        state.isAuthenticated = !!action.payload;
        state.isInitialized = true; // Mark as initialized
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitialized = true; // Mark as initialized
      });
  },
});

// Export Actions
export const { reset, setAccessToken, updateAuthState } = authSlice.actions;

// Export Reducer
export default authSlice.reducer;

// **Export the `selectAuth` Selector**
export const selectAuth = (state: RootState) => state.auth;
