'use client'
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  fetchChores,
  addChore,
  updateChore,
  deleteChore,
  resetError,
  selectChores,
  selectChoresLoading,
  selectChoresError,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  requestChoreSwap,
  approveChoreSwap
} from '../store/slices/choresSlice';
import { CreateChoreDTO, UpdateChoreDTO, CreateSubtaskDTO, UpdateSubtaskDTO } from '../types/chore';
import { useEffect } from 'react';
import { socketClient } from '../lib/socketClient';
import { ChoreWithAssignees } from '../types/api'; // Assuming you have this type

const useChores = (householdId: string) => {
  const dispatch: AppDispatch = useDispatch();
  const chores = useSelector(selectChores);
  const loading = useSelector(selectChoresLoading);
  const error = useSelector(selectChoresError);

  const getChores = async () => {
    await dispatch(fetchChores(householdId));
  };

  const createChore = async (choreData: CreateChoreDTO) => {
    await dispatch(addChore({ householdId, choreData }));
  };

  const editChore = async (choreId: string, choreData: UpdateChoreDTO) => {
    await dispatch(updateChore({ householdId, choreId, choreData }));
  };

  const removeChore = async (choreId: string) => {
    await dispatch(deleteChore({ householdId, choreId }));
  };

  const resetChoresError = () => {
    dispatch(resetError());
  };

  // New Functions for Subtasks
  const addNewSubtask = async (choreId: string, subtaskData: CreateSubtaskDTO) => {
    await dispatch(addSubtask({ householdId, choreId, subtaskData }));
  };

  const updateExistingSubtask = async (choreId: string, subtaskId: string, subtaskData: UpdateSubtaskDTO) => {
    await dispatch(updateSubtask({ householdId, choreId, subtaskId, subtaskData }));
  };

  const removeSubtask = async (choreId: string, subtaskId: string) => {
    await dispatch(deleteSubtask({ householdId, choreId, subtaskId }));
  };

  // New Functions for Chore Swapping
  const initiateChoreSwap = async (choreId: string, targetUserId: string) => {
    await dispatch(requestChoreSwap({ householdId, choreId, targetUserId }));
  };

  const handleChoreSwapApproval = async (choreId: string, swapRequestId: string, approved: boolean) => {
    await dispatch(approveChoreSwap({ householdId, choreId, swapRequestId, approved }));
  };

  useEffect(() => {
    const handleChoreUpdate = (data: { chore: ChoreWithAssignees }) => {
      const choreData: UpdateChoreDTO = {
        title: data.chore.title,
        description: data.chore.description,
        dueDate: data.chore.dueDate,
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
      socketClient.off('chore_update', handleChoreUpdate);
    };
  }, [dispatch, householdId]);

  return {
    chores,
    loading,
    error,
    getChores,
    createChore,
    editChore,
    removeChore,
    resetChoresError,
    // Subtasks
    addNewSubtask,
    updateExistingSubtask,
    removeSubtask,
    // Chore Swapping
    initiateChoreSwap,
    handleChoreSwapApproval,
  };
};

export default useChores;