import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Expense, CreateExpenseDTO, UpdateExpenseDTO, ExpenseSplit } from '../../types/expense';
import { RootState } from '../store';

interface FinancesState {
  expenses: Expense[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  totalExpenses: number;
  totalDebts: number;
  userSummaries: {
    [userId: string]: {
      totalPaid: number;
      totalOwed: number;
      netBalance: number;
    };
  };
}

const initialState: FinancesState = {
  expenses: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  totalExpenses: 0,
  totalDebts: 0,
  userSummaries: {},
};

// Async thunks
export const fetchExpenses = createAsyncThunk<Expense[], string, { rejectValue: string }>(
  'finances/fetchExpenses',
  async (householdId, thunkAPI) => {
    try {
      const response = await apiClient.finances.getExpenses(householdId);
      return response.data;
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
      return response.data;
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
      return response.data;
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

// Helper function to calculate summaries
const calculateSummaries = (expenses: Expense[]) => {
  let totalExpenses = 0;
  let totalDebts = 0;
  const userSummaries: { [userId: string]: { totalPaid: number; totalOwed: number; netBalance: number } } = {};

  expenses.forEach(expense => {
    totalExpenses += expense.amount;

    // Update payer's summary
    if (!userSummaries[expense.paidById]) {
      userSummaries[expense.paidById] = { totalPaid: 0, totalOwed: 0, netBalance: 0 };
    }
    userSummaries[expense.paidById].totalPaid += expense.amount;

    // Update splits
    expense.splits.forEach((split: ExpenseSplit) => {
      if (!userSummaries[split.userId]) {
        userSummaries[split.userId] = { totalPaid: 0, totalOwed: 0, netBalance: 0 };
      }
      userSummaries[split.userId].totalOwed += split.amount;
      totalDebts += split.amount;
    });
  });

  // Calculate net balances
  Object.keys(userSummaries).forEach(userId => {
    userSummaries[userId].netBalance = userSummaries[userId].totalPaid - userSummaries[userId].totalOwed;
  });

  return { totalExpenses, totalDebts, userSummaries };
};

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
        const { totalExpenses, totalDebts, userSummaries } = calculateSummaries(action.payload);
        state.totalExpenses = totalExpenses;
        state.totalDebts = totalDebts;
        state.userSummaries = userSummaries;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to fetch expenses';
      })
      // Add Expense
      .addCase(addExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses.push(action.payload);
        const { totalExpenses, totalDebts, userSummaries } = calculateSummaries(state.expenses);
        state.totalExpenses = totalExpenses;
        state.totalDebts = totalDebts;
        state.userSummaries = userSummaries;
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to add expense';
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
        const { totalExpenses, totalDebts, userSummaries } = calculateSummaries(state.expenses);
        state.totalExpenses = totalExpenses;
        state.totalDebts = totalDebts;
        state.userSummaries = userSummaries;
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to update expense';
      })
      // Delete Expense
      .addCase(deleteExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteExpense.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
        const { totalExpenses, totalDebts, userSummaries } = calculateSummaries(state.expenses);
        state.totalExpenses = totalExpenses;
        state.totalDebts = totalDebts;
        state.userSummaries = userSummaries;
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to delete expense';
      });
  },
});

export const { reset } = financesSlice.actions;

export const selectFinances = (state: RootState) => state.finances;

export default financesSlice.reducer;