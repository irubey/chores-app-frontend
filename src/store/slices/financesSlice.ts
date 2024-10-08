import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import {
  Expense,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  ExpenseSplit,
  TransactionStatus,
  Transaction,
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from "../../types/expense";
import { RootState } from "../store";
import { Receipt } from "../../types/api";
import { createSelector } from "reselect";

export interface FinancesState {
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
  transactions: Transaction[];
  transactionSummaries: {
    [userId: string]: {
      totalSent: number;
      totalReceived: number;
      netBalance: number;
    };
  };
  receipts: {
    [expenseId: string]: Receipt[];
  };
  isUploadingReceipt: boolean;
  uploadReceiptError: string | null;
}

export const initialState: FinancesState = {
  expenses: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  totalExpenses: 0,
  totalDebts: 0,
  userSummaries: {},
  transactions: [],
  transactionSummaries: {},
  receipts: {},
  isUploadingReceipt: false,
  uploadReceiptError: null,
};

// Async thunks for Expenses
export const fetchExpenses = createAsyncThunk<
  Expense[],
  string,
  { rejectValue: string }
>("finances/fetchExpenses", async (householdId, thunkAPI) => {
  try {
    return await apiClient.finances.getExpenses(householdId);
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch expenses";
    return thunkAPI.rejectWithValue(message);
  }
});

export const addExpense = createAsyncThunk<
  Expense,
  { householdId: string; expenseData: CreateExpenseDTO },
  { rejectValue: string }
>("finances/addExpense", async ({ householdId, expenseData }, thunkAPI) => {
  try {
    return await apiClient.finances.createExpense(householdId, expenseData);
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Failed to add expense";
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateExpense = createAsyncThunk<
  Expense,
  { householdId: string; expenseId: string; expenseData: UpdateExpenseDTO },
  { rejectValue: string }
>(
  "finances/updateExpense",
  async ({ householdId, expenseId, expenseData }, thunkAPI) => {
    try {
      return await apiClient.finances.updateExpense(
        householdId,
        expenseId,
        expenseData
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update expense";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteExpense = createAsyncThunk<
  string,
  { householdId: string; expenseId: string },
  { rejectValue: string }
>("finances/deleteExpense", async ({ householdId, expenseId }, thunkAPI) => {
  try {
    await apiClient.finances.deleteExpense(householdId, expenseId);
    return expenseId;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete expense";
    return thunkAPI.rejectWithValue(message);
  }
});

// Async thunks for Transactions
export const fetchTransactions = createAsyncThunk<
  Transaction[],
  string,
  { rejectValue: string }
>("finances/fetchTransactions", async (householdId, thunkAPI) => {
  try {
    return await apiClient.finances.getTransactions(householdId);
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch transactions";
    return thunkAPI.rejectWithValue(message);
  }
});

export const addTransaction = createAsyncThunk<
  Transaction,
  { householdId: string; transactionData: CreateTransactionDTO },
  { rejectValue: string }
>(
  "finances/addTransaction",
  async ({ householdId, transactionData }, thunkAPI) => {
    try {
      return await apiClient.finances.createTransaction(
        householdId,
        transactionData
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to add transaction";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateTransaction = createAsyncThunk<
  Transaction,
  {
    householdId: string;
    transactionId: string;
    transactionData: UpdateTransactionDTO;
  },
  { rejectValue: string }
>(
  "finances/updateTransaction",
  async ({ householdId, transactionId, transactionData }, thunkAPI) => {
    try {
      return await apiClient.finances.updateTransaction(
        householdId,
        transactionId,
        transactionData
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update transaction";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteTransaction = createAsyncThunk<
  string,
  { householdId: string; transactionId: string },
  { rejectValue: string }
>(
  "finances/deleteTransaction",
  async ({ householdId, transactionId }, thunkAPI) => {
    try {
      await apiClient.finances.deleteTransaction(householdId, transactionId);
      return transactionId;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete transaction";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Updated Add Receipt Thunk
export const addReceipt = createAsyncThunk<
  Receipt,
  { householdId: string; file: File },
  { rejectValue: string }
>("finances/addReceipt", async ({ householdId, file }, thunkAPI) => {
  try {
    return await apiClient.finances.uploadReceipt(householdId, file);
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to upload receipt";
    return thunkAPI.rejectWithValue(message);
  }
});

// Memoized selectors
const selectFinancesState = (state: RootState) => state.finances;

export const selectExpenses = createSelector(
  [selectFinancesState],
  (finances) => finances.expenses
);

export const selectTransactions = createSelector(
  [selectFinancesState],
  (finances) => finances.transactions
);

export const selectTotalExpenses = createSelector(
  [selectExpenses],
  (expenses) => expenses.reduce((total, expense) => total + expense.amount, 0)
);

export const selectTotalDebts = createSelector([selectExpenses], (expenses) =>
  expenses.reduce(
    (total, expense) =>
      total +
      expense.splits.reduce(
        (splitTotal, split) => splitTotal + split.amount,
        0
      ),
    0
  )
);

export const selectUserSummaries = createSelector(
  [selectExpenses],
  (expenses) => {
    const userSummaries: {
      [userId: string]: {
        totalPaid: number;
        totalOwed: number;
        netBalance: number;
      };
    } = {};

    expenses.forEach((expense) => {
      if (!userSummaries[expense.paidById]) {
        userSummaries[expense.paidById] = {
          totalPaid: 0,
          totalOwed: 0,
          netBalance: 0,
        };
      }
      userSummaries[expense.paidById].totalPaid += expense.amount;

      expense.splits.forEach((split: ExpenseSplit) => {
        if (!userSummaries[split.userId]) {
          userSummaries[split.userId] = {
            totalPaid: 0,
            totalOwed: 0,
            netBalance: 0,
          };
        }
        userSummaries[split.userId].totalOwed += split.amount;
      });
    });

    Object.keys(userSummaries).forEach((userId) => {
      userSummaries[userId].netBalance =
        userSummaries[userId].totalPaid - userSummaries[userId].totalOwed;
    });

    return userSummaries;
  }
);

export const selectTransactionSummaries = createSelector(
  [selectTransactions],
  (transactions) => {
    const transactionSummaries: {
      [userId: string]: {
        totalSent: number;
        totalReceived: number;
        netBalance: number;
      };
    } = {};

    transactions.forEach((transaction) => {
      if (!transactionSummaries[transaction.fromUserId]) {
        transactionSummaries[transaction.fromUserId] = {
          totalSent: 0,
          totalReceived: 0,
          netBalance: 0,
        };
      }
      if (!transactionSummaries[transaction.toUserId]) {
        transactionSummaries[transaction.toUserId] = {
          totalSent: 0,
          totalReceived: 0,
          netBalance: 0,
        };
      }

      if (transaction.status === TransactionStatus.COMPLETED) {
        transactionSummaries[transaction.fromUserId].totalSent +=
          transaction.amount;
        transactionSummaries[transaction.toUserId].totalReceived +=
          transaction.amount;
      }
    });

    Object.keys(transactionSummaries).forEach((userId) => {
      transactionSummaries[userId].netBalance =
        transactionSummaries[userId].totalReceived -
        transactionSummaries[userId].totalSent;
    });

    return transactionSummaries;
  }
);

export const selectFinances = createSelector(
  [
    selectFinancesState,
    selectTotalExpenses,
    selectTotalDebts,
    selectUserSummaries,
    selectTransactionSummaries,
  ],
  (
    finances,
    totalExpenses,
    totalDebts,
    userSummaries,
    transactionSummaries
  ) => ({
    ...finances,
    totalExpenses,
    totalDebts,
    userSummaries,
    transactionSummaries,
  })
);

// Slice
const financesSlice = createSlice({
  name: "finances",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    clearUploadReceiptError: (state) => {
      state.uploadReceiptError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        fetchExpenses.fulfilled,
        (state, action: PayloadAction<Expense[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.expenses = action.payload;
        }
      )
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch expenses";
      })
      // Add Expense
      .addCase(addExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        addExpense.fulfilled,
        (state, action: PayloadAction<Expense>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.expenses.push(action.payload);
        }
      )
      .addCase(addExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to add expense";
      })
      // Update Expense
      .addCase(updateExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateExpense.fulfilled,
        (state, action: PayloadAction<Expense>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.expenses.findIndex(
            (expense) => expense.id === action.payload.id
          );
          if (index !== -1) {
            state.expenses[index] = action.payload;
          }
        }
      )
      .addCase(updateExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to update expense";
      })
      // Delete Expense
      .addCase(deleteExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        deleteExpense.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.expenses = state.expenses.filter(
            (expense) => expense.id !== action.payload
          );
        }
      )
      .addCase(deleteExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to delete expense";
      })
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        fetchTransactions.fulfilled,
        (state, action: PayloadAction<Transaction[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.transactions = action.payload;
        }
      )
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch transactions";
      })
      // Add Transaction
      .addCase(addTransaction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        addTransaction.fulfilled,
        (state, action: PayloadAction<Transaction>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.transactions.push(action.payload);
        }
      )
      .addCase(addTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to add transaction";
      })
      // Update Transaction
      .addCase(updateTransaction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateTransaction.fulfilled,
        (state, action: PayloadAction<Transaction>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.transactions.findIndex(
            (transaction) => transaction.id === action.payload.id
          );
          if (index !== -1) {
            state.transactions[index] = action.payload;
          }
        }
      )
      .addCase(updateTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to update transaction";
      })
      // Delete Transaction
      .addCase(deleteTransaction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        deleteTransaction.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.transactions = state.transactions.filter(
            (transaction) => transaction.id !== action.payload
          );
        }
      )
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to delete transaction";
      })
      // Add Receipt
      .addCase(addReceipt.pending, (state) => {
        state.isUploadingReceipt = true;
        state.uploadReceiptError = null;
      })
      .addCase(
        addReceipt.fulfilled,
        (state, action: PayloadAction<Receipt>) => {
          state.isUploadingReceipt = false;
          const receipt = action.payload;
          if (!state.receipts[receipt.expenseId]) {
            state.receipts[receipt.expenseId] = [];
          }
          state.receipts[receipt.expenseId].push(receipt);
        }
      )
      .addCase(addReceipt.rejected, (state, action) => {
        state.isUploadingReceipt = false;
        state.uploadReceiptError = action.payload || "Failed to upload receipt";
      });
  },
});

export const { reset, clearUploadReceiptError } = financesSlice.actions;

// Add new selectors
export const selectReceiptsByExpenseId = (
  state: RootState,
  expenseId: string
) => state.finances.receipts[expenseId] || [];
export const selectIsUploadingReceipt = (state: RootState) =>
  state.finances.isUploadingReceipt;
export const selectUploadReceiptError = (state: RootState) =>
  state.finances.uploadReceiptError;

export default financesSlice.reducer;
