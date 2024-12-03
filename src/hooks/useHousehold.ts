"use client";
import { useCallback } from "react";
import { useHouseholds } from "@/contexts/HouseholdsContext";
import {
  Household,
  HouseholdMember,
  HouseholdMemberWithUser,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
  HouseholdWithMembers,
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { logger } from "@/lib/api/logger";

interface UseHouseholdReturn {
  userHouseholds: HouseholdWithMembers[];
  selectedHouseholds: HouseholdWithMembers[];
  selectedMembers: HouseholdMemberWithUser[];
  currentHousehold: HouseholdWithMembers | null;
  members: HouseholdMember[];
  isLoading: boolean;
  error: string | null;
  status: {
    list: "idle" | "loading" | "succeeded" | "failed";
    create: "idle" | "loading" | "succeeded" | "failed";
    update: "idle" | "loading" | "succeeded" | "failed";
    delete: "idle" | "loading" | "succeeded" | "failed";
    member: "idle" | "loading" | "succeeded" | "failed";
    invitation: "idle" | "loading" | "succeeded" | "failed";
  };

  getUserHouseholds: () => Promise<void>;
  getSelectedHouseholds: () => Promise<void>;
  createHousehold: (data: CreateHouseholdDTO) => Promise<void>;
  updateHousehold: (
    householdId: string,
    data: UpdateHouseholdDTO
  ) => Promise<void>;
  deleteHousehold: (householdId: string) => Promise<void>;
  addMember: (householdId: string, data: AddMemberDTO) => Promise<void>;
  removeMember: (householdId: string, memberId: string) => Promise<void>;
  updateMemberRole: (
    householdId: string,
    memberId: string,
    role: HouseholdRole
  ) => Promise<void>;
  updateMemberSelection: (
    householdId: string,
    memberId: string,
    isSelected: boolean
  ) => Promise<void>;
  acceptInvitation: (
    householdId: string,
    memberId: string,
    accept: boolean
  ) => Promise<void>;
  sendInvitation: (householdId: string, email: string) => Promise<void>;
  getInvitations: () => Promise<void>;
  setCurrentHousehold: (household: HouseholdWithMembers) => void;
  reset: () => void;
}

export function useHousehold(): UseHouseholdReturn {
  const {
    userHouseholds,
    selectedHouseholds,
    selectedMembers,
    currentHousehold,
    members,
    status,
    error,
    getUserHouseholds: contextGetUserHouseholds,
    getSelectedHouseholds: contextGetSelectedHouseholds,
    createHousehold: contextCreateHousehold,
    updateHousehold: contextUpdateHousehold,
    deleteHousehold: contextDeleteHousehold,
    addMember: contextAddMember,
    removeMember: contextRemoveMember,
    updateMemberRole: contextUpdateMemberRole,
    updateMemberSelection: contextUpdateMemberSelection,
    acceptInvitation: contextAcceptInvitation,
    sendInvitation: contextSendInvitation,
    getInvitations: contextGetInvitations,
    setCurrentHousehold: contextSetCurrentHousehold,
    reset: contextReset,
  } = useHouseholds();

  const getUserHouseholds = useCallback(async () => {
    logger.debug("useHousehold: Getting user households");
    try {
      await contextGetUserHouseholds();
      logger.info("useHousehold: Successfully got user households");
    } catch (error) {
      logger.error("useHousehold: Failed to get user households", { error });
      throw error;
    }
  }, [contextGetUserHouseholds]);

  const getSelectedHouseholds = useCallback(async () => {
    logger.debug("useHousehold: Getting selected households");
    try {
      await contextGetSelectedHouseholds();
      logger.info("useHousehold: Successfully got selected households");
    } catch (error) {
      logger.error("useHousehold: Failed to get selected households", {
        error,
      });
      throw error;
    }
  }, [contextGetSelectedHouseholds]);

  const createHousehold = useCallback(
    async (data: CreateHouseholdDTO) => {
      logger.debug("useHousehold: Creating household", { data });
      try {
        await contextCreateHousehold(data);
        logger.info("useHousehold: Successfully created household");
      } catch (error) {
        logger.error("useHousehold: Failed to create household", {
          error,
          data,
        });
        throw error;
      }
    },
    [contextCreateHousehold]
  );

  const updateHousehold = useCallback(
    async (householdId: string, data: UpdateHouseholdDTO) => {
      logger.debug("useHousehold: Updating household", { householdId, data });
      try {
        await contextUpdateHousehold(householdId, data);
        logger.info("useHousehold: Successfully updated household", {
          householdId,
        });
      } catch (error) {
        logger.error("useHousehold: Failed to update household", {
          error,
          householdId,
          data,
        });
        throw error;
      }
    },
    [contextUpdateHousehold]
  );

  const deleteHousehold = useCallback(
    async (householdId: string) => {
      logger.debug("useHousehold: Deleting household", { householdId });
      try {
        await contextDeleteHousehold(householdId);
        logger.info("useHousehold: Successfully deleted household", {
          householdId,
        });
      } catch (error) {
        logger.error("useHousehold: Failed to delete household", {
          error,
          householdId,
        });
        throw error;
      }
    },
    [contextDeleteHousehold]
  );

  const addMember = useCallback(
    async (householdId: string, data: AddMemberDTO) => {
      logger.debug("useHousehold: Adding member", { householdId, data });
      try {
        await contextAddMember(householdId, data);
        logger.info("useHousehold: Successfully added member", { householdId });
      } catch (error) {
        logger.error("useHousehold: Failed to add member", {
          error,
          householdId,
          data,
        });
        throw error;
      }
    },
    [contextAddMember]
  );

  const removeMember = useCallback(
    async (householdId: string, memberId: string) => {
      logger.debug("useHousehold: Removing member", { householdId, memberId });
      try {
        await contextRemoveMember(householdId, memberId);
        logger.info("useHousehold: Successfully removed member", {
          householdId,
          memberId,
        });
      } catch (error) {
        logger.error("useHousehold: Failed to remove member", {
          error,
          householdId,
          memberId,
        });
        throw error;
      }
    },
    [contextRemoveMember]
  );

  const updateMemberRole = useCallback(
    async (householdId: string, memberId: string, role: HouseholdRole) => {
      logger.debug("useHousehold: Updating member role", {
        householdId,
        memberId,
        role,
      });
      try {
        await contextUpdateMemberRole(householdId, memberId, role);
        logger.info("useHousehold: Successfully updated member role", {
          householdId,
          memberId,
          role,
        });
      } catch (error) {
        logger.error("useHousehold: Failed to update member role", {
          error,
          householdId,
          memberId,
          role,
        });
        throw error;
      }
    },
    [contextUpdateMemberRole]
  );

  const updateMemberSelection = useCallback(
    async (householdId: string, memberId: string, isSelected: boolean) => {
      logger.debug("useHousehold: Updating member selection", {
        householdId,
        memberId,
        isSelected,
      });
      try {
        await contextUpdateMemberSelection(householdId, memberId, isSelected);
        logger.info("useHousehold: Successfully updated member selection", {
          householdId,
          memberId,
          isSelected,
        });
      } catch (error) {
        logger.error("useHousehold: Failed to update member selection", {
          error,
          householdId,
          memberId,
          isSelected,
        });
        throw error;
      }
    },
    [contextUpdateMemberSelection]
  );

  const acceptInvitation = useCallback(
    async (householdId: string, memberId: string, accept: boolean) => {
      logger.debug("useHousehold: Processing invitation", {
        householdId,
        memberId,
        accept,
      });
      try {
        await contextAcceptInvitation(householdId, memberId, accept);
        logger.info("useHousehold: Successfully processed invitation", {
          householdId,
          memberId,
          accept,
        });
      } catch (error) {
        logger.error("useHousehold: Failed to process invitation", {
          error,
          householdId,
          memberId,
          accept,
        });
        throw error;
      }
    },
    [contextAcceptInvitation]
  );

  const sendInvitation = useCallback(
    async (householdId: string, email: string) => {
      logger.debug("useHousehold: Sending invitation", { householdId, email });
      try {
        await contextSendInvitation(householdId, email);
        logger.info("useHousehold: Successfully sent invitation", {
          householdId,
          email,
        });
      } catch (error) {
        logger.error("useHousehold: Failed to send invitation", {
          error,
          householdId,
          email,
        });
        throw error;
      }
    },
    [contextSendInvitation]
  );

  const getInvitations = useCallback(async () => {
    logger.debug("useHousehold: Getting invitations");
    try {
      await contextGetInvitations();
      logger.info("useHousehold: Successfully got invitations");
    } catch (error) {
      logger.error("useHousehold: Failed to get invitations", { error });
      throw error;
    }
  }, [contextGetInvitations]);

  const setCurrentHousehold = useCallback((household: HouseholdWithMembers) => {
    contextSetCurrentHousehold(household);
  }, []);

  return {
    userHouseholds,
    selectedHouseholds,
    selectedMembers,
    currentHousehold,
    members,
    isLoading: Object.values(status).includes("loading"),
    error,
    status,
    getUserHouseholds,
    getSelectedHouseholds,
    createHousehold,
    updateHousehold,
    deleteHousehold,
    addMember,
    removeMember,
    updateMemberRole,
    updateMemberSelection,
    acceptInvitation,
    sendInvitation,
    getInvitations,
    setCurrentHousehold,
    reset: contextReset,
  };
}
