import { useState, useEffect, useCallback } from 'react';
import { useHousehold } from './useHousehold';
import { choreApi, Chore, CreateChoreData, UpdateChoreData } from '../utils/api';

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
      if (err instanceof Error && err.message.includes('You are not a member of this household')) {
        setChores([]);
        setError('Household not found or you are no longer a member');
      } else {
        setError('Failed to fetch chores');
        console.error('Error fetching chores:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentHousehold) {
      fetchChores(currentHousehold.id);
    } else {
      setChores([]);
      setError(null);
      setIsLoading(false);
    }
  }, [currentHousehold, fetchChores]);

  const createChore = async (choreData: CreateChoreData) => {
    if (!currentHousehold) return;
    setIsLoading(true);
    try {
      console.log('Frontend - Sending chore data to API:', choreData);
      const newChore = await choreApi.create(currentHousehold.id, choreData);
      console.log('Frontend - Received new chore from API:', newChore);
      setChores([...chores, newChore]);
      setError(null);
    } catch (err) {
      setError('Failed to create chore');
      console.error('Error creating chore:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateChore = async (choreId: string, choreData: UpdateChoreData) => {
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
