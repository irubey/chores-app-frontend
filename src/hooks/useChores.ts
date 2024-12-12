"use client";
import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
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
  approveChoreSwap,
} from "../store/slices/choresSlice";
import {
  CreateChoreDTO,
  UpdateChoreDTO,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  ChoreWithAssignees,
  Subtask,
  ChoreSwapRequest,
} from "@shared/types";
import { logger } from "../lib/api/logger";
import { ApiError } from "../lib/api/errors";

const useChores = (householdId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const chores = useSelector(selectChores);
  const loading = useSelector(selectChoresLoading);
  const error = useSelector(selectChoresError);

  const getChores = useCallback(async (): Promise<ChoreWithAssignees[]> => {
    logger.debug("Fetching chores", { householdId });
    try {
      const result = await dispatch(fetchChores(householdId)).unwrap();
      logger.debug("Successfully fetched chores", { count: result.length });
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error("Failed to fetch chores", {
          type: error.type,
          message: error.message,
          status: error.status,
        });
      } else {
        logger.error("Failed to fetch chores with unknown error", { error });
      }
      throw error;
    }
  }, [dispatch, householdId]);

  const createChore = useCallback(
    async (choreData: CreateChoreDTO): Promise<ChoreWithAssignees> => {
      logger.debug("Creating chore", { householdId, choreData });
      try {
        const result = await dispatch(
          addChore({ householdId, choreData })
        ).unwrap();
        logger.debug("Successfully created chore", { choreId: result.id });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to create chore", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to create chore with unknown error", { error });
        }
        throw error;
      }
    },
    [dispatch, householdId]
  );

  const editChore = useCallback(
    async (
      choreId: string,
      choreData: UpdateChoreDTO
    ): Promise<ChoreWithAssignees> => {
      logger.debug("Updating chore", { householdId, choreId, choreData });
      try {
        const result = await dispatch(
          updateChore({ householdId, choreId, choreData })
        ).unwrap();
        logger.debug("Successfully updated chore", { choreId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to update chore", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to update chore with unknown error", { error });
        }
        throw error;
      }
    },
    [dispatch, householdId]
  );

  const removeChore = useCallback(
    async (choreId: string): Promise<string> => {
      logger.debug("Deleting chore", { householdId, choreId });
      try {
        const result = await dispatch(
          deleteChore({ householdId, choreId })
        ).unwrap();
        logger.debug("Successfully deleted chore", { choreId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to delete chore", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to delete chore with unknown error", { error });
        }
        throw error;
      }
    },
    [dispatch, householdId]
  );

  const addNewSubtask = useCallback(
    async (
      choreId: string,
      subtaskData: CreateSubtaskDTO
    ): Promise<Subtask> => {
      logger.debug("Adding subtask", { householdId, choreId, subtaskData });
      try {
        const result = await dispatch(
          addSubtask({ householdId, choreId, subtaskData })
        ).unwrap();
        logger.debug("Successfully added subtask", {
          choreId,
          subtaskId: result.id,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to add subtask", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to add subtask with unknown error", { error });
        }
        throw error;
      }
    },
    [dispatch, householdId]
  );

  const updateExistingSubtask = useCallback(
    async (
      choreId: string,
      subtaskId: string,
      subtaskData: UpdateSubtaskDTO
    ): Promise<Subtask> => {
      logger.debug("Updating subtask", {
        householdId,
        choreId,
        subtaskId,
        subtaskData,
      });
      try {
        const result = await dispatch(
          updateSubtask({
            householdId,
            choreId,
            subtaskId,
            subtaskData,
          })
        ).unwrap();
        logger.debug("Successfully updated subtask", { choreId, subtaskId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to update subtask", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to update subtask with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch, householdId]
  );

  const removeSubtask = useCallback(
    async (choreId: string, subtaskId: string): Promise<void> => {
      logger.debug("Deleting subtask", { householdId, choreId, subtaskId });
      try {
        await dispatch(
          deleteSubtask({ householdId, choreId, subtaskId })
        ).unwrap();
        logger.debug("Successfully deleted subtask", { choreId, subtaskId });
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to delete subtask", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to delete subtask with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch, householdId]
  );

  const initiateChoreSwap = useCallback(
    async (
      choreId: string,
      targetUserId: string
    ): Promise<ChoreSwapRequest> => {
      logger.debug("Requesting chore swap", {
        householdId,
        choreId,
        targetUserId,
      });
      try {
        const result = await dispatch(
          requestChoreSwap({
            householdId,
            choreId,
            targetUserId,
          })
        ).unwrap();
        logger.debug("Successfully requested chore swap", {
          choreId,
          swapRequestId: result.id,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to request chore swap", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to request chore swap with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch, householdId]
  );

  const handleChoreSwapApproval = useCallback(
    async (
      choreId: string,
      swapRequestId: string,
      approved: boolean
    ): Promise<ChoreWithAssignees> => {
      logger.debug("Handling chore swap approval", {
        householdId,
        choreId,
        swapRequestId,
        approved,
      });
      try {
        const result = await dispatch(
          approveChoreSwap({
            householdId,
            choreId,
            swapRequestId,
            approved,
          })
        ).unwrap();
        logger.debug("Successfully handled chore swap approval", {
          choreId,
          swapRequestId,
          approved,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to handle chore swap approval", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error(
            "Failed to handle chore swap approval with unknown error",
            { error }
          );
        }
        throw error;
      }
    },
    [dispatch, householdId]
  );

  const resetChoresError = useCallback(() => {
    dispatch(resetError());
  }, [dispatch]);

  return {
    // State
    chores,
    loading,
    error,

    // Actions
    getChores,
    createChore,
    editChore,
    removeChore,
    resetChoresError,

    // Subtask operations
    addNewSubtask,
    updateExistingSubtask,
    removeSubtask,

    // Chore Swapping
    initiateChoreSwap,
    handleChoreSwapApproval,
  };
};

export default useChores;
