import { ApiResponse } from "@shared/interfaces";
import {
  Expense,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  Transaction,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  Attachment,
  ExpenseWithSplitsAndPaidBy,
  TransactionWithDetails,
  UpdateExpenseSplitDTO,
} from "@shared/types";
import { BaseApiClient } from "../baseClient";

export class FinanceService extends BaseApiClient {
  /**
   * Expenses-related operations
   */
  public readonly expenses = {
    /**
     * Get all expenses for a household
     */
    getExpenses: async (
      householdId: string,
      signal?: AbortSignal
    ): Promise<ExpenseWithSplitsAndPaidBy[]> => {
      const response = await this.axiosInstance.get<
        ApiResponse<ExpenseWithSplitsAndPaidBy[]>
      >(`/households/${householdId}/expenses`, { signal });
      return this.extractData(response);
    },

    /**
     * Create a new expense
     */
    createExpense: async (
      householdId: string,
      expenseData: CreateExpenseDTO,
      signal?: AbortSignal
    ): Promise<ExpenseWithSplitsAndPaidBy> => {
      const response = await this.axiosInstance.post<
        ApiResponse<ExpenseWithSplitsAndPaidBy>
      >(`/households/${householdId}/expenses`, expenseData, { signal });
      return this.extractData(response);
    },

    /**
     * Get details of a specific expense
     */
    getExpenseDetails: async (
      householdId: string,
      expenseId: string,
      signal?: AbortSignal
    ): Promise<ExpenseWithSplitsAndPaidBy> => {
      const response = await this.axiosInstance.get<
        ApiResponse<ExpenseWithSplitsAndPaidBy>
      >(`/households/${householdId}/expenses/${expenseId}`, { signal });
      return this.extractData(response);
    },

    /**
     * Update an existing expense
     */
    updateExpense: async (
      householdId: string,
      expenseId: string,
      expenseData: UpdateExpenseDTO,
      signal?: AbortSignal
    ): Promise<ExpenseWithSplitsAndPaidBy> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<ExpenseWithSplitsAndPaidBy>
      >(`/households/${householdId}/expenses/${expenseId}`, expenseData, {
        signal,
      });
      return this.extractData(response);
    },

    /**
     * Delete an expense
     */
    deleteExpense: async (
      householdId: string,
      expenseId: string,
      signal?: AbortSignal
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/expenses/${expenseId}`,
        { signal }
      );
    },

    /**
     * Upload a receipt for an expense
     */
    uploadReceipt: async (
      householdId: string,
      expenseId: string,
      file: File,
      signal?: AbortSignal
    ): Promise<Attachment> => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await this.axiosInstance.post<ApiResponse<Attachment>>(
        `/households/${householdId}/expenses/${expenseId}/receipts`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          signal,
        }
      );
      return this.extractData(response);
    },

    /**
     * Get all receipts for an expense
     */
    getReceipts: async (
      householdId: string,
      expenseId: string,
      signal?: AbortSignal
    ): Promise<Attachment[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Attachment[]>>(
        `/households/${householdId}/expenses/${expenseId}/receipts`,
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Get a specific receipt
     */
    getReceiptById: async (
      householdId: string,
      expenseId: string,
      receiptId: string,
      signal?: AbortSignal
    ): Promise<Attachment> => {
      const response = await this.axiosInstance.get<ApiResponse<Attachment>>(
        `/households/${householdId}/expenses/${expenseId}/receipts/${receiptId}`,
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Delete a receipt
     */
    deleteReceipt: async (
      householdId: string,
      expenseId: string,
      receiptId: string,
      signal?: AbortSignal
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/expenses/${expenseId}/receipts/${receiptId}`,
        { signal }
      );
    },

    /**
     * Update expense splits between household members
     */
    updateExpenseSplits: async (
      householdId: string,
      expenseId: string,
      splits: UpdateExpenseSplitDTO[],
      signal?: AbortSignal
    ): Promise<ExpenseWithSplitsAndPaidBy> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<ExpenseWithSplitsAndPaidBy>
      >(
        `/households/${householdId}/expenses/${expenseId}/splits`,
        { splits },
        { signal }
      );
      return this.extractData(response);
    },
  };

  /**
   * Transactions-related operations
   */
  public readonly transactions = {
    /**
     * Get all transactions for a household
     */
    getTransactions: async (
      householdId: string,
      signal?: AbortSignal
    ): Promise<TransactionWithDetails[]> => {
      const response = await this.axiosInstance.get<
        ApiResponse<TransactionWithDetails[]>
      >(`/households/${householdId}/transactions`, { signal });
      return this.extractData(response);
    },

    /**
     * Create a new transaction
     */
    createTransaction: async (
      householdId: string,
      transactionData: CreateTransactionDTO,
      signal?: AbortSignal
    ): Promise<TransactionWithDetails> => {
      const response = await this.axiosInstance.post<
        ApiResponse<TransactionWithDetails>
      >(`/households/${householdId}/transactions`, transactionData, { signal });
      return this.extractData(response);
    },

    /**
     * Update transaction status
     */
    updateTransactionStatus: async (
      householdId: string,
      transactionId: string,
      statusData: UpdateTransactionDTO,
      signal?: AbortSignal
    ): Promise<TransactionWithDetails> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<TransactionWithDetails>
      >(
        `/households/${householdId}/transactions/${transactionId}`,
        statusData,
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Delete a transaction
     */
    deleteTransaction: async (
      householdId: string,
      transactionId: string,
      signal?: AbortSignal
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/transactions/${transactionId}`,
        { signal }
      );
    },
  };
}
