'use client'

import React from 'react';
import ChoreForm from '@/components/chores/ChoreForm';
import { useHousehold } from '@/hooks/useHousehold';
import { useRouter } from 'next/navigation';

export default function CreateChorePage() {
  const { currentHousehold } = useHousehold();
  const router = useRouter();

  const handleCreateChore = async (choreData: any) => {
    try {
      // Implement the API call to create a chore
      // You'll need to update this with the actual API call
      // const response = await api.post(`/households/${currentHousehold.id}/chores`, choreData);
      
      // Redirect to the chores list page after successful creation
      router.push('/chores');
    } catch (error) {
      console.error('Error creating chore:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  if (!currentHousehold) {
    return <div>Please select a household first.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Chore</h1>
      <ChoreForm onSubmit={handleCreateChore} />
    </div>
  );
}
