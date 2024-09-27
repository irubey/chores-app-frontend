import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  reset as resetFinances,
} from '../store/slices/financesSlice';
import { apiClient } from '../lib/apiClient';
import { socketClient } from '../lib/socketClient';
import { Expense } from '../types/expense';
import { handleApiError } from '../lib/utils';

/**
 * Custom hook for managing expenses.
 * Provides functionalities to fetch, add, update, and delete expenses.
 * Integrates with Redux for state management and Socket.IO for real-time updates.
 */
const useExpenses = () => {
  const dispatch: AppDispatch = useDispatch();
  const { expenses, isLoading, isSuccess, isError, message } = useSelector(
    (state: RootState) => state.finances
  );

  useEffect(() => {
    // Fetch expenses when the hook is first used
    dispatch(fetchExpenses('currentHouseholdId')); // Replace with actual household ID

    // Listen for real-time expense updates
    socketClient.on('expense_new', (data: { expense: Expense }) => {
      dispatch(addExpense(data.expense));
    });

    socketClient.on('expense_update', (data: { expense: Expense }) => {
      dispatch(updateExpense(data.expense));
    });

    socketClient.on('expense_delete', (data: { expenseId: string }) => {
      dispatch(deleteExpense(data.expenseId));
    });

    // Cleanup listeners on unmount
    return () => {
      socketClient.off('expense_new', () => {});
      socketClient.off('expense_update', () => {});
      socketClient.off('expense_delete', () => {});
      dispatch(resetFinances());
    };
  }, [dispatch]);

  /**
   * Handles adding a new expense.
   * @param expenseData - Data for the new expense.
   */
  const handleAddExpense = async (expenseData: {
    householdId: string;
    amount: number;
    description: string;
    paidById: string;
    dueDate?: Date;
    category?: string;
  }) => {
    try {
      await dispatch(addExpense(expenseData)).unwrap();
    } catch (error) {
      handleApiError(error);
    }
  };

  /**
   * Handles updating an existing expense.
   * @param expenseId - ID of the expense to update.
   * @param updates - Updated data for the expense.
   */
  const handleUpdateExpense = async (
    expenseId: string,
    updates: Partial<Expense>
  ) => {
    try {
      await dispatch(updateExpense({ expenseId, updates })).unwrap();
    } catch (error) {
      handleApiError(error);
    }
  };

  /**
   * Handles deleting an expense.
   * @param expenseId - ID of the expense to delete.
   */
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await dispatch(deleteExpense(expenseId)).unwrap();
    } catch (error) {
      handleApiError(error);
    }
  };

  return {
    expenses,
    isLoading,
    isSuccess,
    isError,
    message,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
  };
};

export default useExpenses;
