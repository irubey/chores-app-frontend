import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  fetchChores,
  addChore,
  updateChore,
  deleteChore as deleteChoreAction,
  reset
} from '../store/slices/choresSlice';
import { handleApiError } from '../lib/utils';
import { socketClient } from '../lib/socketClient';
import { Chore, CreateChoreDTO, UpdateChoreDTO, Subtask } from '../types/chore';
import { ChoreWithAssignees } from '../types/api'; // Assuming you have this type

/**
 * Custom hook for managing chores.
 * Provides state and methods to perform CRUD operations on chores.
 */
const useChores = () => {
  const dispatch: AppDispatch = useDispatch();
  const { chores, isLoading, isSuccess, isError, message } = useSelector((state: RootState) => state.chores);

  /**
   * Fetches all chores for a given household.
   * @param householdId - The ID of the household.
   */
  const fetchAllChores = async (householdId: string) => {
    try {
      await dispatch(fetchChores(householdId)).unwrap();
    } catch (error) {
      handleApiError(error);
    }
  };

  /**
   * Creates a new chore.
   * @param householdId - The ID of the household.
   * @param choreData - The data for the new chore.
   */
  const createNewChore = async (householdId: string, choreData: CreateChoreDTO) => {
    try {
      await dispatch(addChore({ householdId, choreData })).unwrap();
    } catch (error) {
      handleApiError(error);
    }
  };

  /**
   * Updates an existing chore.
   * @param householdId - The ID of the household.
   * @param choreId - The ID of the chore to update.
   * @param choreData - The updated data for the chore.
   */
  const updateExistingChore = async (householdId: string, choreId: string, choreData: UpdateChoreDTO) => {
    try {
      await dispatch(updateChore({ householdId, choreId, choreData })).unwrap();
    } catch (error) {
      handleApiError(error);
    }
  };

  /**
   * Deletes a chore.
   * @param householdId - The ID of the household.
   * @param choreId - The ID of the chore to delete.
   */
  const deleteChore = async (householdId: string, choreId: string) => {
    try {
      await dispatch(deleteChoreAction({ householdId, choreId })).unwrap();
    } catch (error) {
      handleApiError(error);
    }
  };

  /**
   * Resets the chores state.
   */
  const resetChores = () => {
    dispatch(reset());
  };

  /**
   * Handles real-time updates for chores.
   */
  useEffect(() => {
    // Listen for chore updates via Socket.IO
    const handleChoreUpdate = (data: { chore: ChoreWithAssignees }) => {
      const choreData: UpdateChoreDTO = {
        title: data.chore.title,
        description: data.chore.description,
        dueDate: data.chore.dueDate, // already a string
        status: data.chore.status,
        recurrence: data.chore.recurrence,
        priority: data.chore.priority,
        assignedUserIds: data.chore.assignedUsers.map(user => user.id),
        subtasks: data.chore.subtasks.map(subtask => ({
          title: subtask.title,
          status: subtask.status,
        })),
      };
      dispatch(updateChore({ householdId: data.chore.householdId, choreId: data.chore.id, choreData }));
    };

    socketClient.on('chore_update', handleChoreUpdate);

    return () => {
      socketClient.off('chore_update', handleChoreUpdate); // Using the newly added 'off' method
    };
  }, [dispatch]);

  return {
    chores,
    isLoading,
    isSuccess,
    isError,
    message,
    fetchAllChores,
    createNewChore,
    updateExistingChore,
    deleteChore,
    resetChores,
  };
};

export default useChores;
