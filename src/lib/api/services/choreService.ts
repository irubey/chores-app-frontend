import { ApiResponse } from "@shared/interfaces";
import {
  CreateChoreDTO,
  UpdateChoreDTO,
  Subtask,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  ChoreSwapRequest,
  ChoreWithAssignees,
} from "@shared/types";
import { BaseApiClient } from "../baseClient";
import { logger } from "../logger";

export class ChoreService extends BaseApiClient {
  /**
   * Get all chores for a household
   */
  public async getChores(
    householdId: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<ChoreWithAssignees[]>> {
    logger.debug("Getting chores", { householdId });
    return this.handleRequest(() =>
      this.axiosInstance.get<ApiResponse<ChoreWithAssignees[]>>(
        `/households/${householdId}/chores`,
        { signal }
      )
    );
  }

  /**
   * Create a new chore
   */
  public async createChore(
    householdId: string,
    choreData: CreateChoreDTO,
    signal?: AbortSignal
  ): Promise<ApiResponse<ChoreWithAssignees>> {
    logger.debug("Creating chore", { householdId, choreData });
    return this.handleRequest(() =>
      this.axiosInstance.post<ApiResponse<ChoreWithAssignees>>(
        `/households/${householdId}/chores`,
        choreData,
        { signal }
      )
    );
  }

  /**
   * Get details of a specific chore
   */
  public async getChoreDetails(
    householdId: string,
    choreId: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<ChoreWithAssignees>> {
    logger.debug("Getting chore details", { householdId, choreId });
    return this.handleRequest(() =>
      this.axiosInstance.get<ApiResponse<ChoreWithAssignees>>(
        `/households/${householdId}/chores/${choreId}`,
        { signal }
      )
    );
  }

  /**
   * Update an existing chore
   */
  public async updateChore(
    householdId: string,
    choreId: string,
    choreData: UpdateChoreDTO,
    signal?: AbortSignal
  ): Promise<ApiResponse<ChoreWithAssignees>> {
    logger.debug("Updating chore", { householdId, choreId, choreData });
    return this.handleRequest(() =>
      this.axiosInstance.patch<ApiResponse<ChoreWithAssignees>>(
        `/households/${householdId}/chores/${choreId}`,
        choreData,
        { signal }
      )
    );
  }

  /**
   * Delete a chore
   */
  public async deleteChore(
    householdId: string,
    choreId: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<void>> {
    logger.debug("Deleting chore", { householdId, choreId });
    return this.handleRequest(() =>
      this.axiosInstance.delete<ApiResponse<void>>(
        `/households/${householdId}/chores/${choreId}`,
        { signal }
      )
    );
  }

  /**
   * Request a chore swap with another user
   */
  public async requestChoreSwap(
    householdId: string,
    choreId: string,
    targetUserId: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<ChoreSwapRequest>> {
    logger.debug("Requesting chore swap", {
      householdId,
      choreId,
      targetUserId,
    });
    return this.handleRequest(() =>
      this.axiosInstance.post<ApiResponse<ChoreSwapRequest>>(
        `/households/${householdId}/chores/${choreId}/swap-request`,
        { targetUserId },
        { signal }
      )
    );
  }

  /**
   * Approve or reject a chore swap request
   */
  public async approveChoreSwap(
    householdId: string,
    choreId: string,
    swapRequestId: string,
    approved: boolean,
    signal?: AbortSignal
  ): Promise<ApiResponse<ChoreWithAssignees>> {
    logger.debug("Approving chore swap", {
      householdId,
      choreId,
      swapRequestId,
      approved,
    });
    return this.handleRequest(() =>
      this.axiosInstance.patch<ApiResponse<ChoreWithAssignees>>(
        `/households/${householdId}/chores/${choreId}/swap-approve`,
        { approved, swapRequestId },
        { signal }
      )
    );
  }

  public readonly subtasks = {
    /**
     * Get all subtasks for a chore
     */
    getSubtasks: async (
      householdId: string,
      choreId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<Subtask[]>> => {
      logger.debug("Getting subtasks", { householdId, choreId });
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<Subtask[]>>(
          `/households/${householdId}/chores/${choreId}/subtasks`,
          { signal }
        )
      );
    },

    /**
     * Add a new subtask to a chore
     */
    addSubtask: async (
      householdId: string,
      choreId: string,
      subtaskData: CreateSubtaskDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<Subtask>> => {
      logger.debug("Adding subtask", { householdId, choreId, subtaskData });
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<Subtask>>(
          `/households/${householdId}/chores/${choreId}/subtasks`,
          subtaskData,
          { signal }
        )
      );
    },

    /**
     * Update an existing subtask
     */
    updateSubtask: async (
      householdId: string,
      choreId: string,
      subtaskId: string,
      subtaskData: UpdateSubtaskDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<Subtask>> => {
      logger.debug("Updating subtask", {
        householdId,
        choreId,
        subtaskId,
        subtaskData,
      });
      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<Subtask>>(
          `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`,
          subtaskData,
          { signal }
        )
      );
    },

    /**
     * Delete a subtask
     */
    deleteSubtask: async (
      householdId: string,
      choreId: string,
      subtaskId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<void>> => {
      logger.debug("Deleting subtask", { householdId, choreId, subtaskId });
      return this.handleRequest(() =>
        this.axiosInstance.delete<ApiResponse<void>>(
          `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`,
          { signal }
        )
      );
    },
  };
}
