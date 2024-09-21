import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Expense, CreateExpenseDTO, UpdateExpenseDTO } from '../../types/expense';
import { RootState } from '../store';

interface FinancesState {
  expenses: Expense[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: FinancesState = {
  expenses: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Async thunks
export const fetchExpenses = createAsyncThunk<Expense[], string, { rejectValue: string }>(
  'finances/fetchExpenses',
  async (householdId, thunkAPI) => {
    try {
      const response = await apiClient.finances.getExpenses(householdId);
      return response.data; // Assuming apiClient.finances.getExpenses returns Expense[]
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to fetch expenses';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addExpense = createAsyncThunk<Expense, { householdId: string; expenseData: CreateExpenseDTO }, { rejectValue: string }>(
  'finances/addExpense',
  async ({ householdId, expenseData }, thunkAPI) => {
    try {
      const response = await apiClient.finances.createExpense(householdId, expenseData);
      return response.data; // Assuming apiClient.finances.createExpense returns Expense
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to add expense';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateExpense = createAsyncThunk<Expense, { householdId: string; expenseId: string; expenseData: UpdateExpenseDTO }, { rejectValue: string }>(
  'finances/updateExpense',
  async ({ householdId, expenseId, expenseData }, thunkAPI) => {
    try {
      const response = await apiClient.finances.updateExpense(householdId, expenseId, expenseData);
      return response.data; // Assuming apiClient.finances.updateExpense returns Expense
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to update expense';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteExpense = createAsyncThunk<string, { householdId: string; expenseId: string }, { rejectValue: string }>(
  'finances/deleteExpense',
  async ({ householdId, expenseId }, thunkAPI) => {
    try {
      await apiClient.finances.deleteExpense(householdId, expenseId);
      return expenseId;
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to delete expense';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Slice
const financesSlice = createSlice({
  name: 'finances',
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
      // Fetch Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchExpenses.fulfilled, (state, action: PayloadAction<Expense[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add Expense
      .addCase(addExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses.push(action.payload);
      })
      .addCase(addExpense.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update Expense
      .addCase(updateExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.expenses.findIndex(expense => expense.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(updateExpense.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete Expense
      .addCase(deleteExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteExpense.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
      })
      .addCase(deleteExpense.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = financesSlice.actions;

export const selectFinances = (state: RootState) => state.finances;

export default financesSlice.reducer;
