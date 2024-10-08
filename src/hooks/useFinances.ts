"use client";
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
} from "../types/expense";

export const useFinances = () => {
  const dispatch = useDispatch<AppDispatch>();
  const financesState = useSelector(selectFinances);

  const getExpenses = (householdId: string) =>
    dispatch(fetchExpenses(householdId));
  const createExpense = (householdId: string, expenseData: CreateExpenseDTO) =>
    dispatch(addExpense({ householdId, expenseData }));
  const editExpense = (
    householdId: string,
    expenseId: string,
    expenseData: UpdateExpenseDTO
  ) => dispatch(updateExpense({ householdId, expenseId, expenseData }));
  const removeExpense = (householdId: string, expenseId: string) =>
    dispatch(deleteExpense({ householdId, expenseId }));

  const getTransactions = (householdId: string) =>
    dispatch(fetchTransactions(householdId));
  const createTransaction = (
    householdId: string,
    transactionData: CreateTransactionDTO
  ) => dispatch(addTransaction({ householdId, transactionData }));
  const editTransaction = (
    householdId: string,
    transactionId: string,
    transactionData: UpdateTransactionDTO
  ) =>
    dispatch(
      updateTransaction({ householdId, transactionId, transactionData })
    );
  const removeTransaction = (householdId: string, transactionId: string) =>
    dispatch(deleteTransaction({ householdId, transactionId }));

  const uploadReceipt = (householdId: string, file: File) =>
    dispatch(addReceipt({ householdId, file }));

  const resetFinances = () => dispatch(reset());
  const clearReceiptError = () => dispatch(clearUploadReceiptError());

  const getReceiptsByExpenseId = (expenseId: string) =>
    useSelector((state: RootState) =>
      selectReceiptsByExpenseId(state, expenseId)
    );
  const isUploadingReceipt = useSelector(selectIsUploadingReceipt);
  const uploadReceiptError = useSelector(selectUploadReceiptError);

  return {
    ...financesState,
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
    getReceiptsByExpenseId,
    isUploadingReceipt,
    uploadReceiptError,
  };
};
