import { ApiResponse } from "@shared/interfaces";
import { Household, HouseholdMember } from "@shared/types";
import { BaseApiClient } from "../baseClient";
import { HouseholdRole } from "@shared/enums";
import {
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
  HouseholdMemberWithUser,
} from "@shared/types";
import { ApiError } from "../errors";

export class HouseholdService extends BaseApiClient {
  /**
   * Get all households for the current user
   */
  public async getUserHouseholds(signal?: AbortSignal): Promise<Household[]> {
    const response = await this.axiosInstance.get<ApiResponse<Household[]>>(
      "/households",
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Create a new household
   */
  public async createHousehold(
    data: CreateHouseholdDTO,
    signal?: AbortSignal
  ): Promise<Household> {
    const response = await this.axiosInstance.post<ApiResponse<Household>>(
      "/households",
      data,
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Get details of a specific household
   */
  public async getHousehold(
    householdId: string,
    signal?: AbortSignal
  ): Promise<Household> {
    const response = await this.axiosInstance.get<ApiResponse<Household>>(
      `/households/${householdId}`,
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Update a household's details
   */
  public async updateHousehold(
    householdId: string,
    data: UpdateHouseholdDTO,
    signal?: AbortSignal
  ): Promise<Household> {
    const response = await this.axiosInstance.patch<ApiResponse<Household>>(
      `/households/${householdId}`,
      data,
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Delete a household
   */
  public async deleteHousehold(
    householdId: string,
    signal?: AbortSignal
  ): Promise<void> {
    await this.axiosInstance.delete(`/households/${householdId}`, { signal });
  }

  /**
   * Get the currently selected households
   */
  public async getSelectedHouseholds(
    signal?: AbortSignal
  ): Promise<HouseholdMemberWithUser[]> {
    const response = await this.axiosInstance.get<
      ApiResponse<HouseholdMemberWithUser[]>
    >("/households/selected", {
      signal,
      params: {
        include: "household",
      },
    });
    return this.extractData(response);
  }

  /**
   * Member management operations
   */
  public readonly members = {
    /**
     * Get all members of a household
     */
    getMembers: async (
      householdId: string,
      signal?: AbortSignal
    ): Promise<HouseholdMember[]> => {
      const response = await this.axiosInstance.get<
        ApiResponse<HouseholdMember[]>
      >(`/households/${householdId}/members`, { signal });
      return this.extractData(response);
    },

    /**
     * Add a new member to the household
     */
    addMember: async (
      householdId: string,
      data: AddMemberDTO,
      signal?: AbortSignal
    ): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.post<
        ApiResponse<HouseholdMember>
      >(`/households/${householdId}/members`, data, { signal });
      return this.extractData(response);
    },

    /**
     * Remove a member from the household
     */
    removeMember: async (
      householdId: string,
      memberId: string,
      signal?: AbortSignal
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/members/${memberId}`,
        { signal }
      );
    },

    /**
     * Update a member's role in the household
     */
    updateMemberRole: async (
      householdId: string,
      memberId: string,
      role: HouseholdRole,
      signal?: AbortSignal
    ): Promise<HouseholdMember> => {
      try {
        const response = await this.axiosInstance.patch<
          ApiResponse<HouseholdMember>
        >(
          `/households/${householdId}/members/${memberId}/role`,
          { role },
          { signal }
        );
        return this.extractData(response);
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError("Failed to update member role", 500);
      }
    },

    /**
     * Update the selection status of a member
     */
    updateSelection: async (
      householdId: string,
      memberId: string,
      isSelected: boolean,
      signal?: AbortSignal
    ): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<HouseholdMember>
      >(
        `/households/${householdId}/members/${memberId}/selection`,
        { isSelected },
        { signal }
      );
      return this.extractData(response);
    },
  };

  // Update the invitations namespace to use the existing endpoint
  public invitations = {
    /**
     * Send an invitation to join the household
     */
    sendInvitation: async (
      householdId: string,
      email: string,
      signal?: AbortSignal
    ): Promise<void> => {
      await this.axiosInstance.post(
        `/households/${householdId}/invitations`,
        { email },
        { signal }
      );
    },

    /**
     * Update a member's status (accept/reject invitation)
     */
    updateMemberInvitationStatus: async (
      householdId: string,
      memberId: string,
      accept: boolean,
      signal?: AbortSignal
    ): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<HouseholdMember>
      >(
        `/households/${householdId}/members/${memberId}/status`,
        { accept },
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Get all pending invitations for the current user
     */
    getInvitations: async (
      signal?: AbortSignal
    ): Promise<HouseholdMember[]> => {
      const response = await this.axiosInstance.get<
        ApiResponse<HouseholdMember[]>
      >(`/households/invitations`, { signal });
      return this.extractData(response);
    },
  };
}
