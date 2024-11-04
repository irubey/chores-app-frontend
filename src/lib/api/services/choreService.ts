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
    const response = await this.axiosInstance.get<
      ApiResponse<ChoreWithAssignees[]>
    >(`/households/${householdId}/chores`, { signal });
    return this.extractData(response);
  }

  /**
   * Create a new chore
   */
  public async createChore(
    householdId: string,
    choreData: CreateChoreDTO,
    signal?: AbortSignal
  ): Promise<ChoreWithAssignees> {
    const response = await this.axiosInstance.post<
      ApiResponse<ChoreWithAssignees>
    >(`/households/${householdId}/chores`, choreData, { signal });
    return this.extractData(response);
  }

  /**
   * Get details of a specific chore
   */
  public async getChoreDetails(
    householdId: string,
    choreId: string,
    signal?: AbortSignal
  ): Promise<ChoreWithAssignees> {
    const response = await this.axiosInstance.get<
      ApiResponse<ChoreWithAssignees>
    >(`/households/${householdId}/chores/${choreId}`, { signal });
    return this.extractData(response);
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
    const response = await this.axiosInstance.patch<
      ApiResponse<ChoreWithAssignees>
    >(`/households/${householdId}/chores/${choreId}`, choreData, { signal });
    return this.extractData(response);
  }

  /**
   * Delete a chore
   */
  public async deleteChore(
    householdId: string,
    choreId: string,
    signal?: AbortSignal
  ): Promise<void> {
    await this.axiosInstance.delete(
      `/households/${householdId}/chores/${choreId}`,
      { signal }
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
    const response = await this.axiosInstance.post<
      ApiResponse<ChoreSwapRequest>
    >(
      `/households/${householdId}/chores/${choreId}/swap-request`,
      { targetUserId },
      { signal }
    );
    return this.extractData(response);
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
    const response = await this.axiosInstance.patch<
      ApiResponse<ChoreWithAssignees>
    >(
      `/households/${householdId}/chores/${choreId}/swap-approve`,
      { approved, swapRequestId },
      { signal }
    );
    return this.extractData(response);
  }

  // Subtasks are implemented as a nested service
  public readonly subtasks = {
    /**
     * Get all subtasks for a chore
     */
    getSubtasks: async (
      householdId: string,
      choreId: string,
      signal?: AbortSignal
    ): Promise<Subtask[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Subtask[]>>(
        `/households/${householdId}/chores/${choreId}/subtasks`,
        { signal }
      );
      return this.extractData(response);
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
      const response = await this.axiosInstance.post<ApiResponse<Subtask>>(
        `/households/${householdId}/chores/${choreId}/subtasks`,
        subtaskData,
        { signal }
      );
      return this.extractData(response);
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
      const response = await this.axiosInstance.patch<ApiResponse<Subtask>>(
        `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`,
        subtaskData,
        { signal }
      );
      return this.extractData(response);
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
      await this.axiosInstance.delete(
        `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`,
        { signal }
      );
    },
  };
}
