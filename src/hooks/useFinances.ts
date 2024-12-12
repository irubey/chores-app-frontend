"use client";
import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  fetchTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addReceipt,
  reset,
  clearUploadReceiptError,
  selectFinances,
  selectReceiptsByExpenseId,
  selectIsUploadingReceipt,
  selectUploadReceiptError,
} from "../store/slices/financesSlice";
import {
  CreateExpenseDTO,
  UpdateExpenseDTO,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  ExpenseWithSplitsAndPaidBy,
  TransactionWithDetails,
  Receipt,
} from "@shared/types";
import { logger } from "../lib/api/logger";
import { ApiError } from "../lib/api/errors";

export const useFinances = () => {
  const dispatch = useDispatch<AppDispatch>();
  const financesState = useSelector(selectFinances);
  const isUploadingReceipt = useSelector(selectIsUploadingReceipt);
  const uploadReceiptError = useSelector(selectUploadReceiptError);

  const getReceiptsByExpenseId = useCallback(
    (expenseId: string) =>
      useSelector((state: RootState) =>
        selectReceiptsByExpenseId(state, expenseId)
      ),
    []
  );

  const getExpenses = useCallback(
    async (householdId: string): Promise<ExpenseWithSplitsAndPaidBy[]> => {
      logger.debug("Fetching expenses", { householdId });
      try {
        const result = await dispatch(fetchExpenses(householdId)).unwrap();
        logger.debug("Successfully fetched expenses", { count: result.length });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to fetch expenses", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to fetch expenses with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const createExpense = useCallback(
    async (
      householdId: string,
      expenseData: CreateExpenseDTO
    ): Promise<ExpenseWithSplitsAndPaidBy> => {
      logger.debug("Creating expense", { householdId, expenseData });
      try {
        const result = await dispatch(
          addExpense({ householdId, expenseData })
        ).unwrap();
        logger.debug("Successfully created expense", { expenseId: result.id });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to create expense", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to create expense with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const editExpense = useCallback(
    async (
      householdId: string,
      expenseId: string,
      expenseData: UpdateExpenseDTO
    ): Promise<ExpenseWithSplitsAndPaidBy> => {
      logger.debug("Updating expense", { householdId, expenseId, expenseData });
      try {
        const result = await dispatch(
          updateExpense({ householdId, expenseId, expenseData })
        ).unwrap();
        logger.debug("Successfully updated expense", { expenseId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to update expense", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to update expense with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const removeExpense = useCallback(
    async (householdId: string, expenseId: string): Promise<string> => {
      logger.debug("Deleting expense", { householdId, expenseId });
      try {
        const result = await dispatch(
          deleteExpense({ householdId, expenseId })
        ).unwrap();
        logger.debug("Successfully deleted expense", { expenseId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to delete expense", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to delete expense with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const getTransactions = useCallback(
    async (householdId: string): Promise<TransactionWithDetails[]> => {
      logger.debug("Fetching transactions", { householdId });
      try {
        const result = await dispatch(fetchTransactions(householdId)).unwrap();
        logger.debug("Successfully fetched transactions", {
          count: result.length,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to fetch transactions", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to fetch transactions with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const createTransaction = useCallback(
    async (
      householdId: string,
      transactionData: CreateTransactionDTO
    ): Promise<TransactionWithDetails> => {
      logger.debug("Creating transaction", { householdId, transactionData });
      try {
        const result = await dispatch(
          addTransaction({ householdId, transactionData })
        ).unwrap();
        logger.debug("Successfully created transaction", {
          transactionId: result.id,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to create transaction", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to create transaction with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const editTransaction = useCallback(
    async (
      householdId: string,
      transactionId: string,
      transactionData: UpdateTransactionDTO
    ): Promise<TransactionWithDetails> => {
      logger.debug("Updating transaction", {
        householdId,
        transactionId,
        transactionData,
      });
      try {
        const result = await dispatch(
          updateTransaction({
            householdId,
            transactionId,
            transactionData,
          })
        ).unwrap();
        logger.debug("Successfully updated transaction", { transactionId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to update transaction", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to update transaction with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const removeTransaction = useCallback(
    async (householdId: string, transactionId: string): Promise<string> => {
      logger.debug("Deleting transaction", { householdId, transactionId });
      try {
        const result = await dispatch(
          deleteTransaction({ householdId, transactionId })
        ).unwrap();
        logger.debug("Successfully deleted transaction", { transactionId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to delete transaction", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to delete transaction with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const uploadReceipt = useCallback(
    async (
      householdId: string,
      expenseId: string,
      file: File
    ): Promise<Receipt> => {
      logger.debug("Uploading receipt", { householdId, expenseId });
      try {
        const result = await dispatch(
          addReceipt({ householdId, expenseId, file })
        ).unwrap();
        logger.debug("Successfully uploaded receipt", {
          expenseId,
          receiptId: result.id,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to upload receipt", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to upload receipt with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const resetFinances = useCallback(() => {
    logger.debug("Resetting finances state");
    dispatch(reset());
  }, [dispatch]);

  const clearReceiptError = useCallback(() => {
    logger.debug("Clearing receipt upload error");
    dispatch(clearUploadReceiptError());
  }, [dispatch]);

  return {
    // State
    ...financesState,
    isUploadingReceipt,
    uploadReceiptError,
    getReceiptsByExpenseId,

    // Actions
    getExpenses,
    createExpense,
    editExpense,
    removeExpense,
    getTransactions,
    createTransaction,
    editTransaction,
    removeTransaction,
    uploadReceipt,
    resetFinances,
    clearReceiptError,
  };
};
