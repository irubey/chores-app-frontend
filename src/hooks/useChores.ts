import { useState, useEffect, useCallback } from 'react';
import { useHousehold } from './useHousehold';
import { choreApi } from '../utils/api';

export interface Chore {
  id: string;
  householdId: string;
  title: string;
  description?: string | null;
  timeEstimate?: number | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  assignedTo?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date | null;
  lastCompleted?: Date | null;
  templateId?: string | null;
}

export const useChores = () => {
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentHousehold } = useHousehold();

  const fetchChores = useCallback(async (householdId: string) => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      const fetchedChores = await choreApi.getAll(householdId);
      setChores(fetchedChores);
      setError(null);
    } catch (err) {
      setError('Failed to fetch chores');
      console.error('Error fetching chores:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentHousehold) {
      fetchChores(currentHousehold.id);
    }
  }, [currentHousehold, fetchChores]);

  const createChore = async (choreData: Omit<Chore, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (!currentHousehold) return;
    setIsLoading(true);
    try {
      const newChore = await choreApi.create(currentHousehold.id, choreData);
      setChores([...chores, newChore]);
      setError(null);
    } catch (err) {
      setError('Failed to create chore');
      console.error('Error creating chore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChore = async (choreId: string, choreData: Partial<Chore>) => {
    setIsLoading(true);
    try {
      const updatedChore = await choreApi.update(choreId, choreData);
      setChores(chores.map(chore => chore.id === choreId ? updatedChore : chore));
      setError(null);
    } catch (err) {
      setError('Failed to update chore');
      console.error('Error updating chore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChore = async (choreId: string) => {
    setIsLoading(true);
    try {
      await choreApi.delete(choreId);
      setChores(chores.filter(chore => chore.id !== choreId));
      setError(null);
    } catch (err) {
      setError('Failed to delete chore');
      console.error('Error deleting chore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const completeChore = async (choreId: string) => {
    setIsLoading(true);
    try {
      await choreApi.complete(choreId);
      setChores(chores.map(chore => 
        chore.id === choreId ? { ...chore, status: 'COMPLETED' } : chore
      ));
      setError(null);
    } catch (err) {
      setError('Failed to complete chore');
      console.error('Error completing chore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getChore = async (choreId: string) => {
    setIsLoading(true);
    try {
      const chore = await choreApi.getOne(choreId);
      setError(null);
      return chore;
    } catch (err) {
      setError('Failed to fetch chore');
      console.error('Error fetching chore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    chores,
    isLoading,
    error,
    fetchChores,
    createChore,
    updateChore,
    deleteChore,
    completeChore,
    getChore,
  };
};
