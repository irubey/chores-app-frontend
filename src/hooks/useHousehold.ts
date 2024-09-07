import { useContext } from 'react';
import { HouseholdContext } from '../contexts/HouseholdContext';

export interface Household {
  id: string;
  name: string;
  members: { id: string; name: string; role: string }[];
}

export interface HouseholdContextType {
  households: Household[];
  currentHousehold: Household | null;
  setCurrentHousehold: (household: Household | null) => void;
  fetchHouseholds: () => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  inviteMember: (householdId: string, email: string, role: string) => Promise<void>;
  isLoading: boolean;
  removeMember: (householdId: string, userId: string) => Promise<void>;
}

export const useHousehold = (): HouseholdContextType => {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};