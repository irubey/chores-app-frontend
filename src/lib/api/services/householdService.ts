import { ApiResponse } from "@shared/interfaces";
import { Household, HouseholdMember } from "@shared/types";
import { BaseApiClient } from "../baseClient";

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
    data: {
      name: string;
      description?: string;
    },
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
    data: { name?: string; description?: string },
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
   * Get the currently selected household
   */
  public async getSelectedHousehold(signal?: AbortSignal): Promise<Household> {
    const response = await this.axiosInstance.get<ApiResponse<Household>>(
      `/households/selected`,
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Send an invitation to join the household
   */
  public async sendInvitation(
    householdId: string,
    email: string,
    signal?: AbortSignal
  ): Promise<void> {
    await this.axiosInstance.post(
      `/households/${householdId}/invitations`,
      {
        email,
      },
      { signal }
    );
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
      data: { email: string; role: string },
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
     * Update a member's status (accept/reject invitation)
     */
    updateMemberStatus: async (
      householdId: string,
      memberId: string,
      status: "ACCEPTED" | "REJECTED",
      signal?: AbortSignal
    ): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<HouseholdMember>
      >(
        `/households/${householdId}/members/${memberId}/status`,
        { status },
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Update a member's role in the household
     */
    updateMemberRole: async (
      householdId: string,
      memberId: string,
      role: string,
      signal?: AbortSignal
    ): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<HouseholdMember>
      >(
        `/households/${householdId}/members/${memberId}/role`,
        { role },
        { signal }
      );
      return this.extractData(response);
    },

    /**
     * Update the selected household for a member
     */
    updateSelectedHousehold: async (
      householdId: string,
      memberId: string,
      signal?: AbortSignal
    ): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<HouseholdMember>
      >(
        `/households/${householdId}/members/${memberId}/selection`,
        {},
        { signal }
      );
      return this.extractData(response);
    },
  };
}
