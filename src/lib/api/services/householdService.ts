import { ApiResponse } from "@shared/interfaces";
import { BaseApiClient } from "../baseClient";
import {
  Household,
  HouseholdMember,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
  HouseholdMemberWithUser,
  HouseholdWithMembers,
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { logger } from "../logger";

export class HouseholdService extends BaseApiClient {
  /**
   * Get all households for the current user
   */
  public async getUserHouseholds(
    signal?: AbortSignal
  ): Promise<ApiResponse<HouseholdWithMembers[]>> {
    logger.debug("Fetching user households");

    return this.handleRequest(() =>
      this.axiosInstance.get<ApiResponse<HouseholdWithMembers[]>>(
        "/households",
        {
          signal,
        }
      )
    );
  }

  /**
   * Create a new household
   */
  public async createHousehold(
    data: CreateHouseholdDTO,
    signal?: AbortSignal
  ): Promise<ApiResponse<Household>> {
    logger.debug("Creating new household", { data });

    return this.handleRequest(() =>
      this.axiosInstance.post<ApiResponse<Household>>("/households", data, {
        signal,
      })
    );
  }

  /**
   * Get details of a specific household
   */
  public async getHousehold(
    householdId: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<HouseholdWithMembers>> {
    logger.debug("Fetching household details", { householdId });

    return this.handleRequest(() =>
      this.axiosInstance.get<ApiResponse<HouseholdWithMembers>>(
        `/households/${householdId}`,
        { signal }
      )
    );
  }

  /**
   * Update a household's details
   */
  public async updateHousehold(
    householdId: string,
    data: UpdateHouseholdDTO,
    signal?: AbortSignal
  ): Promise<ApiResponse<HouseholdWithMembers>> {
    logger.debug("Updating household", { householdId, data });

    return this.handleRequest(() =>
      this.axiosInstance.patch<ApiResponse<HouseholdWithMembers>>(
        `/households/${householdId}`,
        data,
        { signal }
      )
    );
  }

  /**
   * Delete a household
   */
  public async deleteHousehold(
    householdId: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<void>> {
    logger.debug("Deleting household", { householdId });

    return this.handleRequest(() =>
      this.axiosInstance.delete<ApiResponse<void>>(
        `/households/${householdId}`,
        {
          signal,
        }
      )
    );
  }

  /**
   * Get the currently selected households
   */
  public async getSelectedHouseholds(
    signal?: AbortSignal
  ): Promise<ApiResponse<HouseholdMemberWithUser[]>> {
    logger.debug("Fetching selected households");

    return this.handleRequest(() =>
      this.axiosInstance.get<ApiResponse<HouseholdMemberWithUser[]>>(
        "/households/selected",
        {
          signal,
          params: {
            include: "household",
          },
        }
      )
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
    ): Promise<ApiResponse<HouseholdMember[]>> => {
      logger.debug("Fetching household members", { householdId });

      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<HouseholdMember[]>>(
          `/households/${householdId}/members`,
          { signal }
        )
      );
    },

    /**
     * Add a new member to the household
     */
    addMember: async (
      householdId: string,
      data: AddMemberDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<HouseholdMember>> => {
      logger.debug("Adding household member", { householdId, data });

      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<HouseholdMember>>(
          `/households/${householdId}/members`,
          data,
          { signal }
        )
      );
    },

    /**
     * Remove a member from the household
     */
    removeMember: async (
      householdId: string,
      memberId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<void>> => {
      logger.debug("Removing household member", { householdId, memberId });

      return this.handleRequest(() =>
        this.axiosInstance.delete<ApiResponse<void>>(
          `/households/${householdId}/members/${memberId}`,
          { signal }
        )
      );
    },

    /**
     * Update member role
     */
    updateMemberRole: async (
      householdId: string,
      memberId: string,
      role: HouseholdRole,
      signal?: AbortSignal
    ): Promise<ApiResponse<HouseholdMember>> => {
      logger.debug("Updating member role", { householdId, memberId, role });

      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<HouseholdMember>>(
          `/households/${householdId}/members/${memberId}/role`,
          { role },
          { signal }
        )
      );
    },

    /**
     * Update selection status
     */
    updateSelection: async (
      householdId: string,
      memberId: string,
      isSelected: boolean,
      signal?: AbortSignal
    ): Promise<ApiResponse<HouseholdMember>> => {
      logger.debug("Updating member selection", {
        householdId,
        memberId,
        isSelected,
      });

      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<HouseholdMember>>(
          `/households/${householdId}/members/${memberId}/selection`,
          { isSelected },
          { signal }
        )
      );
    },
  };

  /**
   * Invitation operations
   */
  public readonly invitations = {
    /**
     * Send invitation
     */
    sendInvitation: async (
      householdId: string,
      email: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<void>> => {
      logger.debug("Sending household invitation", { householdId, email });

      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<void>>(
          `/households/${householdId}/invitations`,
          { email },
          { signal }
        )
      );
    },

    /**
     * Get invitations
     */
    getInvitations: async (
      signal?: AbortSignal
    ): Promise<ApiResponse<HouseholdMember[]>> => {
      logger.debug("Fetching household invitations");

      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<HouseholdMember[]>>(
          `/households/invitations`,
          { signal }
        )
      );
    },

    /**
     * Update invitation status
     */
    updateMemberInvitationStatus: async (
      householdId: string,
      memberId: string,
      accept: boolean,
      signal?: AbortSignal
    ): Promise<ApiResponse<HouseholdMember>> => {
      logger.debug("Updating invitation status", {
        householdId,
        memberId,
        accept,
      });

      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<HouseholdMember>>(
          `/households/${householdId}/members/${memberId}/status`,
          { accept },
          { signal }
        )
      );
    },
  };
}
