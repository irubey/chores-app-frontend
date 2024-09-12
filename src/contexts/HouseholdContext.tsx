'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { useRouter } from 'next/navigation';

interface Household {
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
  joinHousehold: (householdId: string) => Promise<void>;
  fetchHouseholdById: (householdId: string) => Promise<Household | null>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  deleteHousehold: (householdId: string) => Promise<void>;
  leaveHousehold: (householdId: string) => Promise<void>;
}

export const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [householdCache, setHouseholdCache] = useState<Record<string, Household>>({});

  useEffect(() => {
    if (user && households.length === 0) {
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
      setError('Failed to fetch households');
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
    if (householdCache[householdId]) {
      return householdCache[householdId];
    }

    setIsLoading(true);
    try {
      const household = await api.get(`/api/households/${householdId}`);
      setHouseholdCache(prev => ({ ...prev, [householdId]: household }));
      setError(null);
      return household;
    } catch (error: unknown) {
      console.error('Failed to fetch household:', error);
      if (error instanceof Error) {
        if (error.message === 'Not Found') {
          setHouseholds(prevHouseholds => prevHouseholds.filter(h => h.id !== householdId));
          setCurrentHousehold(null);
          setError('Household not found');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unknown error occurred');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHousehold = async (householdId: string) => {
    try {
      await api.delete(`/api/households/${householdId}`);
      setHouseholds(prevHouseholds => prevHouseholds.filter(h => h.id !== householdId));
      if (currentHousehold?.id === householdId) {
        setCurrentHousehold(null);
      }
      // Force a re-fetch of households to ensure the context is up-to-date
      await fetchHouseholds();
      if (households.length === 1) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Delete household error:', error);
      if (error instanceof Error) {
        if (error.message === 'Not Found') {
          // Remove the non-existent household from the local state
          setHouseholds(prevHouseholds => prevHouseholds.filter(h => h.id !== householdId));
          setCurrentHousehold(null);
        }
        throw error;
      } else {
        throw new Error('An unknown error occurred');
      }
    }
  };

  const leaveHousehold = async (householdId: string) => {
    try {
      await api.post(`/api/households/${householdId}/leave`, {});
      setHouseholds(households.filter(h => h.id !== householdId));
      if (currentHousehold?.id === householdId) {
        setCurrentHousehold(null);
      }
      if (households.length === 1) {
        // This was the last household
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Leave household error:', error);
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
        joinHousehold,
        fetchHouseholdById,
        error,
        setError,
        deleteHousehold,
        leaveHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

