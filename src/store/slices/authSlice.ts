import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { User } from '../../types/user';
import { RootState } from '../store';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Async thunks
export const login = createAsyncThunk<User, { email: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const response = await apiClient.auth.login(credentials);
      return response.user; // {{ change: return User from ApiResponse }}
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'Login failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk<User, { email: string; password: string; name: string }, { rejectValue: string }>(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      const response = await apiClient.auth.register(userData);
      return response.data; // {{ change: return User from ApiResponse }}
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
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
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'Logout failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action: PayloadAction<string>) => { // {{ change: PayloadAction<string> }}
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action: PayloadAction<string>) => { // {{ change: PayloadAction<string> }}
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(logout.rejected, (state, action: PayloadAction<string>) => { // {{ change: PayloadAction<string> }}
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
