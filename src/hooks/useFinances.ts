'use client'
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  selectFinances,
  reset,
} from '../store/slices/financesSlice';
import { CreateExpenseDTO, UpdateExpenseDTO } from '../types/expense';

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
    userSummaries 
  } = useSelector((state: RootState) => selectFinances(state));

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

  return {
    expenses,
    isLoading,
    isSuccess,
    isError,
    message,
    totalExpenses,
    totalDebts,
    userSummaries,
    getExpenses,
    createExpense,
    editExpense,
    removeExpense,
    resetFinances,
  };
};

export default useFinances;