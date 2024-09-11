'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  joinHousehold: (householdId: string) => Promise<void>;
  fetchHouseholdById: (householdId: string) => Promise<Household | null>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

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

  const joinHousehold = async (householdId: string) => {
    try {
      const joinedHousehold = await api.post(`/api/households/${householdId}/join`, { userId: user?.id });
      setHouseholds([...households, joinedHousehold]);
      setCurrentHousehold(joinedHousehold);
    } catch (error) {
      console.error('Join household error:', error);
      throw error;
    }
  };

  const fetchHouseholdById = async (householdId: string) => {
    setIsLoading(true);
    try {
      const household = await api.get(`/api/households/${householdId}`);
      setError(null);
      return household;
    } catch (error) {
      console.error('Failed to fetch household:', error);
      setError('Failed to fetch household');
      return null;
    } finally {
      setIsLoading(false);
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
        joinHousehold,
        fetchHouseholdById,
        error,
        setError,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

