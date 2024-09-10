'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

interface Household {
  id: string;
  name: string;
  members: { id: string; name: string; role: string }[];
}

// Add removeMember to the HouseholdContextType interface
interface HouseholdContextType {
  households: Household[];
  currentHousehold: Household | null;
  setCurrentHousehold: (household: Household | null) => void;
  fetchHouseholds: () => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  inviteMember: (householdId: string, email: string, role: string) => Promise<void>;
  isLoading: boolean;
  removeMember: (householdId: string, userId: string) => Promise<void>;
}

export const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHouseholds();
    }
  }, [user]);

  const fetchHouseholds = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/api/households');
      setHouseholds(data);
      if (data.length > 0 && !currentHousehold) {
        setCurrentHousehold(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch households:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createHousehold = async (name: string) => {
    try {
      const newHousehold = await api.post('/api/households', { name });
      setHouseholds([...households, newHousehold]);
      setCurrentHousehold(newHousehold);
    } catch (error) {
      console.error('Create household error:', error);
      throw error;
    }
  };

  const inviteMember = async (householdId: string, email: string, role: string) => {
    try {
      await api.post(`/api/households/${householdId}/members`, { email, role });
      await fetchHouseholds(); // Refresh the household data
    } catch (error) {
      console.error('Invite member error:', error);
      throw error;
    }
  };

  const removeMember = async (householdId: string, userId: string) => {
    try {
      await api.delete(`/api/households/${householdId}/members/${userId}`);
      await fetchHouseholds(); // Refresh the household data
    } catch (error) {
      console.error('Remove member error:', error);
      throw error;
    }
  };

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        setCurrentHousehold,
        fetchHouseholds,
        createHousehold,
        inviteMember,
        isLoading,
        removeMember,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

