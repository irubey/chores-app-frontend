'use client'

import React, { useState, useEffect } from 'react';
import { useChores, Chore } from '../../hooks/useChores';
import { useHousehold } from '../../hooks/useHousehold';
import ChoreList from '../../components/chores/ChoreList';
import ChoreForm from '../../components/chores/ChoreForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ChoresPage() {
  const { chores, isLoading, error, fetchChores, createChore, updateChore, deleteChore, completeChore } = useChores();
  const { currentHousehold } = useHousehold();
  const [isAddingChore, setIsAddingChore] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);


  useEffect(() => {
    if (currentHousehold) {
      fetchChores(currentHousehold.id);
    }
  }, [currentHousehold, fetchChores]);

  const handleAddChore = async (choreData: Omit<Chore, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    await createChore(choreData);
    setIsAddingChore(false);
  };

  const handleEditChore = async (choreData: Partial<Chore>) => {
    if (editingChore) {
      await updateChore(editingChore.id, choreData);
      setEditingChore(null);
    }
  };

  const handleDeleteChore = async (choreId: string) => {
    await deleteChore(choreId);
  };

  const handleCompleteChore = async (choreId: string) => {
    await completeChore(choreId);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Household Chores</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        onClick={() => setIsAddingChore(true)}
      >
        Add New Chore
      </button>
      {isAddingChore && (
        <ChoreForm onSubmit={handleAddChore} onCancel={() => setIsAddingChore(false)} />
      )}
      {editingChore && (
        <ChoreForm
          onSubmit={handleEditChore}
          onCancel={() => setEditingChore(null)}
          initialData={editingChore}
        />
      )}
      <ChoreList
        chores={chores}
        onEdit={setEditingChore}
        onDelete={handleDeleteChore}
        onComplete={handleCompleteChore}
      />
    </div>
  );
}
