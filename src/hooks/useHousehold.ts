"use client";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import {
  fetchUserHouseholds,
  fetchHousehold,
  fetchHouseholdMembers,
  inviteMember,
  removeMember,
  createHousehold,
  updateHousehold,
  deleteHousehold,
  updateMemberInvitationStatus,
  fetchSelectedHouseholds,
  toggleHouseholdSelection,
  updateMemberRole,
  addMember,
  getInvitations,
  sendInvitation,
  setCurrentHousehold,
  reset,
  selectUserHouseholds,
  selectSelectedHouseholds,
  selectSelectedMembers,
  selectCurrentHousehold,
  selectHouseholdMembers,
  selectHouseholdStatus,
  selectHouseholdError,
} from "../store/slices/householdSlice";
import {
  Household,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
  HouseholdMember,
  HouseholdMemberWithUser,
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";

export const useHousehold = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Use individual selectors for better performance
  const households = useSelector(selectUserHouseholds);
  const currentHousehold = useSelector(selectCurrentHousehold);
  const members = useSelector(selectHouseholdMembers);
  const selectedHouseholds = useSelector(selectSelectedHouseholds);
  const selectedMembers = useSelector(selectSelectedMembers);
  const status = useSelector(selectHouseholdStatus);
  const error = useSelector(selectHouseholdError);

  // Household Actions
  const fetchHouseholds = useCallback(async (): Promise<Household[]> => {
    logger.debug("Fetching households");
    try {
      const result = await dispatch(fetchUserHouseholds()).unwrap();
      logger.debug("Successfully fetched households", { count: result.length });
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error("Failed to fetch households", {
          type: error.type,
          message: error.message,
          status: error.status,
        });
      } else {
        logger.error("Failed to fetch households with unknown error", {
          error,
        });
      }
      throw error;
    }
  }, [dispatch]);

  const fetchHouseholdDetails = useCallback(
    async (householdId: string): Promise<Household> => {
      logger.debug("Fetching household details", { householdId });
      try {
        const result = await dispatch(fetchHousehold(householdId)).unwrap();
        logger.debug("Successfully fetched household details", { householdId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to fetch household details", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to fetch household details with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const createNewHousehold = useCallback(
    async (data: CreateHouseholdDTO): Promise<Household> => {
      logger.debug("Creating new household", { data });
      try {
        const result = await dispatch(createHousehold(data)).unwrap();
        logger.debug("Successfully created household", {
          householdId: result.id,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to create household", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to create household with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const updateHouseholdDetails = useCallback(
    async (
      householdId: string,
      data: UpdateHouseholdDTO
    ): Promise<Household> => {
      logger.debug("Updating household", { householdId, data });
      try {
        const result = await dispatch(
          updateHousehold({ householdId, data })
        ).unwrap();
        logger.debug("Successfully updated household", { householdId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to update household", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to update household with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const removeHousehold = useCallback(
    async (householdId: string): Promise<void> => {
      logger.debug("Removing household", { householdId });
      try {
        await dispatch(deleteHousehold(householdId)).unwrap();
        logger.debug("Successfully removed household", { householdId });
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to remove household", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to remove household with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  // Member Actions
  const fetchMembers = useCallback(
    async (householdId: string): Promise<HouseholdMember[]> => {
      logger.debug("Fetching members", { householdId });
      try {
        const result = await dispatch(
          fetchHouseholdMembers(householdId)
        ).unwrap();
        logger.debug("Successfully fetched members", {
          householdId,
          count: result.length,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to fetch members", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to fetch members with unknown error", { error });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const inviteNewMember = useCallback(
    async (householdId: string, email: string): Promise<HouseholdMember> => {
      logger.debug("Inviting new member", { householdId, email });
      try {
        const result = await dispatch(
          inviteMember({ householdId, email })
        ).unwrap();
        logger.debug("Successfully invited member", { householdId, email });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to invite member", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to invite member with unknown error", { error });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const removeMemberAction = useCallback(
    async (householdId: string, memberId: string): Promise<string> => {
      logger.debug("Removing member", { householdId, memberId });
      try {
        const result = await dispatch(
          removeMember({ householdId, memberId })
        ).unwrap();
        logger.debug("Successfully removed member", { householdId, memberId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to remove member", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to remove member with unknown error", { error });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const updateMemberRoleAction = useCallback(
    async (
      householdId: string,
      memberId: string,
      role: HouseholdRole
    ): Promise<HouseholdMember> => {
      logger.debug("Updating member role", { householdId, memberId, role });
      try {
        const result = await dispatch(
          updateMemberRole({ householdId, memberId, role })
        ).unwrap();
        logger.debug("Successfully updated member role", {
          householdId,
          memberId,
          role,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to update member role", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to update member role with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  // Selection Actions
  const getSelectedHouseholds = useCallback(async (): Promise<
    HouseholdMemberWithUser[]
  > => {
    logger.debug("Fetching selected households");
    try {
      const result = await dispatch(fetchSelectedHouseholds()).unwrap();
      logger.debug("Successfully fetched selected households", {
        count: result.length,
      });
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error("Failed to fetch selected households", {
          type: error.type,
          message: error.message,
          status: error.status,
        });
      } else {
        logger.error("Failed to fetch selected households with unknown error", {
          error,
        });
      }
      throw error;
    }
  }, [dispatch]);

  const toggleSelection = useCallback(
    async (
      householdId: string,
      memberId: string,
      isSelected: boolean
    ): Promise<HouseholdMember> => {
      logger.debug("Toggling household selection", {
        householdId,
        memberId,
        isSelected,
      });
      try {
        const result = await dispatch(
          toggleHouseholdSelection({ householdId, memberId, isSelected })
        ).unwrap();
        logger.debug("Successfully toggled household selection", {
          householdId,
          memberId,
          isSelected,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to toggle household selection", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error(
            "Failed to toggle household selection with unknown error",
            { error }
          );
        }
        throw error;
      }
    },
    [dispatch]
  );

  // State Management
  const setCurrent = useCallback(
    (household: Household) => {
      logger.debug("Setting current household", { householdId: household.id });
      dispatch(setCurrentHousehold(household));
    },
    [dispatch]
  );

  const resetHouseholdState = useCallback(() => {
    logger.debug("Resetting household state");
    dispatch(reset());
  }, [dispatch]);

  return {
    // State
    households,
    currentHousehold,
    members,
    selectedHouseholds,
    selectedMembers,
    status,
    error,

    // Household Actions
    fetchHouseholds,
    fetchHouseholdDetails,
    createNewHousehold,
    updateHouseholdDetails,
    removeHousehold,

    // Member Actions
    fetchMembers,
    inviteMember: inviteNewMember,
    removeMember: removeMemberAction,
    updateMemberRole: updateMemberRoleAction,

    // Selection Actions
    getSelectedHouseholds,
    toggleHouseholdSelection: toggleSelection,

    // State Management
    setCurrent,
    resetHouseholdState,
  };
};
