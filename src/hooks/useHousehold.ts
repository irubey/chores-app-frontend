import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  fetchUserHouseholds,
  getHousehold,
  createHousehold,
  updateHousehold,
  deleteHousehold,
  fetchHouseholdMembers,
  inviteHouseholdMember,
  removeHouseholdMember,
  fetchSelectedHouseholds,
  toggleHouseholdSelection,
  setCurrentHousehold,
  reset,
  selectHousehold,
  selectSelectedHouseholds,
} from '../store/slices/householdSlice';
import { Household, HouseholdMember } from '../types/household';

export const useHousehold = () => {
  const dispatch = useDispatch<AppDispatch>();
  const householdState = useSelector(selectHousehold);
  const selectedHouseholds = useSelector(selectSelectedHouseholds);

  const fetchHouseholds = useCallback(() => dispatch(fetchUserHouseholds()), [dispatch]);
  const getHouseholdById = useCallback((id: string) => dispatch(getHousehold(id)), [dispatch]);
  const createNewHousehold = useCallback((name: string) => dispatch(createHousehold({ name })), [dispatch]);
  const updateHouseholdDetails = useCallback((householdId: string, data: Partial<Household>) => 
    dispatch(updateHousehold({ householdId, data })), [dispatch]);
  const removeHousehold = useCallback((id: string) => dispatch(deleteHousehold(id)), [dispatch]);
  const fetchMembers = useCallback((householdId: string) => dispatch(fetchHouseholdMembers(householdId)), [dispatch]);
  const inviteMember = useCallback((householdId: string, email: string, role?: 'ADMIN' | 'MEMBER') => 
    dispatch(inviteHouseholdMember({ householdId, email, role })), [dispatch]);
  const removeMember = useCallback((householdId: string, memberId: string) => 
    dispatch(removeHouseholdMember({ householdId, memberId })), [dispatch]);
  const fetchSelected = useCallback(() => dispatch(fetchSelectedHouseholds()), [dispatch]);
  const toggleSelection = useCallback((householdId: string, isSelected: boolean) => 
    dispatch(toggleHouseholdSelection({ householdId, isSelected })), [dispatch]);
  const setCurrent = useCallback((household: Household) => dispatch(setCurrentHousehold(household)), [dispatch]);
  const resetHouseholdState = useCallback(() => dispatch(reset()), [dispatch]);

  return {
    // State
    households: householdState.userHouseholds,
    currentHousehold: householdState.currentHousehold,
    members: householdState.members,
    selectedHouseholds,
    isLoading: householdState.isLoading,
    isSuccess: householdState.isSuccess,
    isError: householdState.isError,
    message: householdState.message,

    // Actions
    fetchHouseholds,
    getHouseholdById,
    createNewHousehold,
    updateHouseholdDetails,
    removeHousehold,
    fetchMembers,
    inviteMember,
    removeMember,
    fetchSelected,
    toggleSelection,
    setCurrent,
    resetHouseholdState,
  };
};