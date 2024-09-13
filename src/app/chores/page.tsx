'use client'

import React, { useState, useEffect } from 'react';
import { useChores, Chore } from '../../hooks/useChores';
import { useHousehold } from '../../hooks/useHousehold';
import ChoreList from '../../components/chores/ChoreList';
import ChoreForm from '../../components/chores/ChoreForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Link from 'next/link';

export default function ChoresPage() {
  const { chores, isLoading, error, fetchChores, updateChore, deleteChore, completeChore } = useChores();
  const { currentHousehold } = useHousehold();
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  useEffect(() => {
    if (currentHousehold) {
      fetchChores(currentHousehold.id);
    }
  }, [currentHousehold, fetchChores]);

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
      <Link href="/chores/create" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 inline-block">
        Add New Chore
      </Link>
      {editingChore && currentHousehold && (
        <ChoreForm
          onSubmit={handleEditChore}
          onCancel={() => setEditingChore(null)}
          initialData={editingChore}
          householdMembers={currentHousehold.members}
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
