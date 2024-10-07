'use client'
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  selectFinances,
  selectReceiptsByExpenseId,
  selectIsUploadingReceipt,
  selectUploadReceiptError,
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  fetchTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addReceipt,
  clearUploadReceiptError,
  reset,
} from '../store/slices/financesSlice';
import {
  CreateExpenseDTO,
  UpdateExpenseDTO,
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '../types/expense';

const useFinances = (householdId: string) => {
  const dispatch: AppDispatch = useDispatch();
  const {
    expenses,
    isLoading,
    isSuccess,
    isError,
    message,
    totalExpenses,
    totalDebts,
    userSummaries,
    transactions,
    transactionSummaries,
    receipts,
  } = useSelector(selectFinances);

  const getExpenses = async () => {
    await dispatch(fetchExpenses(householdId));
  };

  const createExpense = async (expenseData: CreateExpenseDTO) => {
    await dispatch(addExpense({ householdId, expenseData }));
  };

  const editExpense = async (expenseId: string, expenseData: UpdateExpenseDTO) => {
    await dispatch(updateExpense({ householdId, expenseId, expenseData }));
  };

  const removeExpense = async (expenseId: string) => {
    await dispatch(deleteExpense({ householdId, expenseId }));
  };

  const resetFinances = () => {
    dispatch(reset());
  };

  const fetchTransactionsData = async () => {
    await dispatch(fetchTransactions(householdId));
  };

  const createTransaction = async (transactionData: CreateTransactionDTO) => {
    await dispatch(addTransaction({ householdId, transactionData }));
  };

  const updateTransactionData = async (transactionId: string, transactionData: UpdateTransactionDTO) => {
    await dispatch(updateTransaction({ householdId, transactionId, transactionData }));
  };

  const removeTransaction = async (transactionId: string) => {
    await dispatch(deleteTransaction({ householdId, transactionId }));
  };

  const uploadReceipt = async (expenseId: string, file: File) => {
    await dispatch(addReceipt({ householdId, expenseId, receiptFile: file }));
  };

  const clearReceiptUploadError = () => {
    dispatch(clearUploadReceiptError());
  };

  const getReceiptsByExpenseId = (expenseId: string) => {
    return useSelector((state: RootState) => selectReceiptsByExpenseId(state, expenseId));
  };

  const getIsUploadingReceipt = () => {
    return useSelector(selectIsUploadingReceipt);
  };

  const getUploadReceiptError = () => {
    return useSelector(selectUploadReceiptError);
  };

  return {
    expenses,
    isLoading,
    isSuccess,
    isError,
    message,
    totalExpenses,
    totalDebts,
    userSummaries,
    transactions,
    transactionSummaries,
    receipts,
    getExpenses,
    createExpense,
    editExpense,
    removeExpense,
    fetchTransactions: fetchTransactionsData,
    createTransaction,
    updateTransaction: updateTransactionData,
    removeTransaction,
    uploadReceipt,
    clearReceiptUploadError,
    getReceiptsByExpenseId,
    getIsUploadingReceipt,
    getUploadReceiptError,
    resetFinances,
  };
};

export default useFinances;