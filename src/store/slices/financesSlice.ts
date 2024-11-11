import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/api/apiClient";
import {
  ExpenseWithSplitsAndPaidBy,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  ExpenseSplit,
  TransactionWithDetails,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  Receipt,
} from "@shared/types";
import { TransactionStatus } from "@shared/enums";
import { RootState } from "../store";
import { createSelector } from "reselect";
import { ApiError } from "../../lib/api/errors/apiErrors";
import { logger } from "../../lib/api/logger";

export interface FinancesState {
  expenses: ExpenseWithSplitsAndPaidBy[];
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
  transactions: TransactionWithDetails[];
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
  ExpenseWithSplitsAndPaidBy[],
  string,
  { rejectValue: string }
>("finances/fetchExpenses", async (householdId, thunkAPI) => {
  try {
    logger.debug("Fetching expenses", { householdId });
    const response = await apiClient.finances.expenses.getExpenses(householdId);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to fetch expenses");
  }
});

export const addExpense = createAsyncThunk<
  ExpenseWithSplitsAndPaidBy,
  { householdId: string; expenseData: CreateExpenseDTO },
  { rejectValue: string }
>("finances/addExpense", async ({ householdId, expenseData }, thunkAPI) => {
  try {
    logger.debug("Adding expense", { householdId, expenseData });
    const response = await apiClient.finances.expenses.createExpense(
      householdId,
      expenseData
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to add expense");
  }
});

export const updateExpense = createAsyncThunk<
  ExpenseWithSplitsAndPaidBy,
  { householdId: string; expenseId: string; expenseData: UpdateExpenseDTO },
  { rejectValue: string }
>(
  "finances/updateExpense",
  async ({ householdId, expenseId, expenseData }, thunkAPI) => {
    try {
      logger.debug("Updating expense", { householdId, expenseId, expenseData });
      const response = await apiClient.finances.expenses.updateExpense(
        householdId,
        expenseId,
        expenseData
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue("Failed to update expense");
    }
  }
);

export const deleteExpense = createAsyncThunk<
  string,
  { householdId: string; expenseId: string },
  { rejectValue: string }
>("finances/deleteExpense", async ({ householdId, expenseId }, thunkAPI) => {
  try {
    logger.debug("Deleting expense", { householdId, expenseId });
    await apiClient.finances.expenses.deleteExpense(householdId, expenseId);
    return expenseId;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to delete expense");
  }
});

// Async thunks for Transactions
export const fetchTransactions = createAsyncThunk<
  TransactionWithDetails[],
  string,
  { rejectValue: string }
>("finances/fetchTransactions", async (householdId, thunkAPI) => {
  try {
    logger.debug("Fetching transactions", { householdId });
    const response = await apiClient.finances.transactions.getTransactions(
      householdId
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to fetch transactions");
  }
});

export const addTransaction = createAsyncThunk<
  TransactionWithDetails,
  { householdId: string; transactionData: CreateTransactionDTO },
  { rejectValue: string }
>(
  "finances/addTransaction",
  async ({ householdId, transactionData }, thunkAPI) => {
    try {
      logger.debug("Adding transaction", { householdId, transactionData });
      const response = await apiClient.finances.transactions.createTransaction(
        householdId,
        transactionData
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue("Failed to add transaction");
    }
  }
);

export const updateTransaction = createAsyncThunk<
  TransactionWithDetails,
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
      logger.debug("Updating transaction", {
        householdId,
        transactionId,
        transactionData,
      });
      const response =
        await apiClient.finances.transactions.updateTransactionStatus(
          householdId,
          transactionId,
          transactionData
        );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue("Failed to update transaction");
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
      logger.debug("Deleting transaction", { householdId, transactionId });
      await apiClient.finances.transactions.deleteTransaction(
        householdId,
        transactionId
      );
      return transactionId;
    } catch (error) {
      if (error instanceof ApiError) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue("Failed to delete transaction");
    }
  }
);

// Updated Add Receipt Thunk
export const addReceipt = createAsyncThunk<
  Receipt,
  { householdId: string; expenseId: string; file: File },
  { rejectValue: string }
>("finances/addReceipt", async ({ householdId, expenseId, file }, thunkAPI) => {
  try {
    logger.debug("Uploading receipt", { householdId, expenseId });
    const response = await apiClient.finances.expenses.uploadReceipt(
      householdId,
      expenseId,
      file
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to upload receipt");
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
        (state, action: PayloadAction<ExpenseWithSplitsAndPaidBy[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.expenses = action.payload;
        }
      )
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to fetch expenses";
      })
      // Add Expense
      .addCase(addExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        addExpense.fulfilled,
        (state, action: PayloadAction<ExpenseWithSplitsAndPaidBy>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.expenses.push(action.payload);
        }
      )
      .addCase(addExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to add expense";
      })
      // Update Expense
      .addCase(updateExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateExpense.fulfilled,
        (state, action: PayloadAction<ExpenseWithSplitsAndPaidBy>) => {
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
        state.message = action.payload ?? "Failed to update expense";
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
        state.message = action.payload ?? "Failed to delete expense";
      })
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        fetchTransactions.fulfilled,
        (state, action: PayloadAction<TransactionWithDetails[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.transactions = action.payload;
        }
      )
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to fetch transactions";
      })
      // Add Transaction
      .addCase(addTransaction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        addTransaction.fulfilled,
        (state, action: PayloadAction<TransactionWithDetails>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.transactions.push(action.payload);
        }
      )
      .addCase(addTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to add transaction";
      })
      // Update Transaction
      .addCase(updateTransaction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateTransaction.fulfilled,
        (state, action: PayloadAction<TransactionWithDetails>) => {
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
        state.message = action.payload ?? "Failed to update transaction";
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
        state.message = action.payload ?? "Failed to delete transaction";
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
        state.uploadReceiptError =
          (action.payload as string) || "Failed to upload receipt";
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
