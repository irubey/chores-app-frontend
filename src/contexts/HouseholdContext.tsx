'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { householdApi } from '../utils/api';

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
      const response = await fetch('/api/households', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setHouseholds(data);
        if (data.length > 0 && !currentHousehold) {
          setCurrentHousehold(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch households:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createHousehold = async (name: string) => {
    try {
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      });
      if (response.ok) {
        const newHousehold = await response.json();
        setHouseholds([...households, newHousehold]);
        setCurrentHousehold(newHousehold);
      } else {
        throw new Error('Failed to create household');
      }
    } catch (error) {
      console.error('Create household error:', error);
      throw error;
    }
  };

  const inviteMember = async (householdId: string, email: string, role: string) => {
    try {
      const response = await fetch(`/api/households/${householdId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
        credentials: 'include',
      });
      if (response.ok) {
        await fetchHouseholds(); // Refresh the household data
      } else {
        throw new Error('Failed to invite member');
      }
    } catch (error) {
      console.error('Invite member error:', error);
      throw error;
    }
  };

  const removeMember = async (householdId: string, userId: string) => {
    try {
      await householdApi.removeMember(householdId, userId);
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

