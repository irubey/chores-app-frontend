import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  fetchUserHouseholds,
  createHousehold,
  updateHousehold,
  deleteHousehold,
  fetchHouseholdMembers,
  inviteMember,
  removeMember,
  rejectInvitation,
  setCurrentHousehold,
  reset,
  selectHousehold,
  updateMemberRole,
  updateMemberStatus,
  fetchSelectedHouseholds,
  toggleHouseholdSelection,
  acceptInvitation,
  getHouseholdDetails,
} from "../store/slices/householdSlice";
import { Household, HouseholdMember } from "../types/household";

export const useHousehold = () => {
  const dispatch = useDispatch<AppDispatch>();
  const householdState = useSelector(selectHousehold);

  // Existing Actions
  const fetchHouseholds = useCallback(
    () => dispatch(fetchUserHouseholds()),
    [dispatch]
  );
  const createNewHousehold = useCallback(
    (data: { name: string; currency: string }) =>
      dispatch(createHousehold(data)),
    [dispatch]
  );
  const updateHouseholdDetails = useCallback(
    (householdId: string, data: Partial<Omit<Household, "id" | "members">>) =>
      dispatch(updateHousehold({ householdId, data })),
    [dispatch]
  );
  const removeHousehold = useCallback(
    (id: string) => dispatch(deleteHousehold(id)),
    [dispatch]
  );
  const fetchMembers = useCallback(
    (householdId: string) => dispatch(fetchHouseholdMembers(householdId)),
    [dispatch]
  );

  // Keep this more detailed version
  const sendInvitation = useCallback(
    (householdId: string, email: string) =>
      dispatch(inviteMember({ householdId, email })),
    [dispatch]
  );

  const removeMemberAction = useCallback(
    (householdId: string, memberId: string) =>
      dispatch(removeMember({ householdId, memberId })),
    [dispatch]
  );
  const setCurrent = useCallback(
    (household: Household) => dispatch(setCurrentHousehold(household)),
    [dispatch]
  );
  const resetHouseholdState = () => dispatch(reset());

  const updateMemberRoleAction = useCallback(
    (householdId: string, memberId: string, role: "ADMIN" | "MEMBER") =>
      dispatch(updateMemberRole({ householdId, memberId, role })),
    [dispatch]
  );

  // Updated and New Actions
  const getHouseholdDetailsAction = useCallback(
    (householdId: string) => dispatch(getHouseholdDetails(householdId)),
    [dispatch]
  );
  const updateMemberStatusAction = useCallback(
    (householdId: string, memberId: string, status: "ACCEPTED" | "REJECTED") =>
      dispatch(updateMemberStatus({ householdId, memberId, status })),
    [dispatch]
  );
  const getSelectedHouseholds = useCallback(
    () => dispatch(fetchSelectedHouseholds()),
    [dispatch]
  );
  const toggleHouseholdSelectionAction = useCallback(
    (householdId: string, memberId: string, isSelected: boolean) =>
      dispatch(toggleHouseholdSelection({ householdId, memberId, isSelected })),
    [dispatch]
  );
  const acceptInvitationAction = useCallback(
    (token: string) => dispatch(acceptInvitation({ token })),
    [dispatch]
  );

  const rejectInvitationAction = useCallback(
    (token: string) => dispatch(rejectInvitation({ token })),
    [dispatch]
  );

  return {
    // State
    households: householdState.userHouseholds,
    currentHousehold: householdState.currentHousehold,
    members: householdState.members,
    isLoading: householdState.isLoading,
    isSuccess: householdState.isSuccess,
    isError: householdState.isError,
    message: householdState.message,

    // Actions
    fetchHouseholds,
    createNewHousehold,
    updateHouseholdDetails,
    removeHousehold,
    fetchMembers,
    inviteMember: sendInvitation,
    removeMember: removeMemberAction,
    setCurrent,
    resetHouseholdState,
    updateMemberRole: updateMemberRoleAction,

    // New and Updated Actions
    getHouseholdDetails: getHouseholdDetailsAction,
    updateMemberStatus: updateMemberStatusAction,
    getSelectedHouseholds,
    toggleHouseholdSelection: toggleHouseholdSelectionAction,
    acceptInvitation: acceptInvitationAction,
    rejectInvitation: rejectInvitationAction,
  };
};
