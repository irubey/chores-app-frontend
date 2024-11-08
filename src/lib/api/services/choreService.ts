import { ApiResponse } from "@shared/interfaces";
import {
  Chore,
  CreateChoreDTO,
  UpdateChoreDTO,
  Subtask,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  ChoreSwapRequest,
  ChoreWithAssignees,
} from "@shared/types";
import { BaseApiClient } from "../baseClient";

export class ChoreService extends BaseApiClient {
  /**
   * Get all chores for a household
   */
  public async getChores(
    householdId: string,
    signal?: AbortSignal
  ): Promise<ChoreWithAssignees[]> {
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
  ): Promise<ChoreWithAssignees> {
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
  ): Promise<ChoreWithAssignees> {
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
  ): Promise<ChoreWithAssignees> {
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
  ): Promise<void> {
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
  ): Promise<ChoreSwapRequest> {
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
  ): Promise<ChoreWithAssignees> {
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
    ): Promise<Subtask[]> => {
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
    ): Promise<Subtask> => {
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
    ): Promise<Subtask> => {
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
    ): Promise<void> => {
      return this.handleRequest(() =>
        this.axiosInstance.delete<ApiResponse<void>>(
          `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`,
          { signal }
        )
      );
    },
  };
}
