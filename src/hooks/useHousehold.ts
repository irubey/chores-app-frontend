import { useContext } from 'react';
import { HouseholdContext, HouseholdContextType } from '../contexts/HouseholdContext';

export interface Household {
  id: string;
  name: string;
  members: { id: string; name: string; role: string }[];
}


export const useHousehold = (): HouseholdContextType => {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};
