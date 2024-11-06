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
  selectHousehold,
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
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";

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
  const fetchHouseholds = useCallback(
    () => dispatch(fetchUserHouseholds()),
    [dispatch]
  );

  const fetchHouseholdDetails = useCallback(
    (householdId: string) => dispatch(fetchHousehold(householdId)),
    [dispatch]
  );

  const createNewHousehold = useCallback(
    (data: CreateHouseholdDTO) => dispatch(createHousehold(data)),
    [dispatch]
  );

  const updateHouseholdDetails = useCallback(
    (householdId: string, data: UpdateHouseholdDTO) =>
      dispatch(updateHousehold({ householdId, data })),
    [dispatch]
  );

  const removeHousehold = useCallback(
    (householdId: string) => dispatch(deleteHousehold(householdId)),
    [dispatch]
  );

  // Member Actions
  const fetchMembers = useCallback(
    (householdId: string) => dispatch(fetchHouseholdMembers(householdId)),
    [dispatch]
  );

  const inviteNewMember = useCallback(
    (householdId: string, email: string) =>
      dispatch(inviteMember({ householdId, email })),
    [dispatch]
  );

  const removeMemberAction = useCallback(
    (householdId: string, memberId: string) =>
      dispatch(removeMember({ householdId, memberId })),
    [dispatch]
  );

  const updateMemberRoleAction = useCallback(
    (householdId: string, memberId: string, role: HouseholdRole) =>
      dispatch(updateMemberRole({ householdId, memberId, role })),
    [dispatch]
  );

  // Selection Actions
  const getSelectedHouseholds = useCallback(
    () => dispatch(fetchSelectedHouseholds()),
    [dispatch]
  );

  const toggleSelection = useCallback(
    (householdId: string, memberId: string, isSelected: boolean) =>
      dispatch(toggleHouseholdSelection({ householdId, memberId, isSelected })),
    [dispatch]
  );

  // Invitation Actions
  const sendInvitationAction = useCallback(
    (householdId: string, email: string) =>
      dispatch(sendInvitation({ householdId, email })),
    [dispatch]
  );

  const updateInvitationStatus = useCallback(
    (householdId: string, memberId: string, accept: boolean) =>
      dispatch(updateMemberInvitationStatus({ householdId, memberId, accept })),
    [dispatch]
  );

  const getInvitationsList = useCallback(
    () => dispatch(getInvitations()),
    [dispatch]
  );

  // State Management
  const setCurrent = useCallback(
    (household: Household) => dispatch(setCurrentHousehold(household)),
    [dispatch]
  );

  const resetHouseholdState = useCallback(() => dispatch(reset()), [dispatch]);

  const addNewMember = useCallback(
    (householdId: string, data: AddMemberDTO) =>
      dispatch(addMember({ householdId, data })),
    [dispatch]
  );

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

    // Invitation Actions
    sendInvitation: sendInvitationAction,
    updateInvitationStatus,
    getInvitations: getInvitationsList,

    // State Management
    setCurrent,
    resetHouseholdState,
    addMember: addNewMember,
  };
};
