'use client'

import React, { useState } from 'react';
import ChoreForm from '@/components/chores/ChoreForm';
import ChoreTemplateList from '@/components/templates/ChoreTemplateList';
import { useHousehold } from '@/hooks/useHousehold';
import { useChores } from '@/hooks/useChores';
import { useRouter } from 'next/navigation';

export default function CreateChorePage() {
  const { currentHousehold } = useHousehold();
  const { createChore } = useChores();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleCreateChore = async (choreData: any) => {
    try {
      await createChore(choreData);
      router.push('/chores');
    } catch (error) {
      console.error('Error creating chore:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
  };

  if (!currentHousehold) {
    return <div>Please select a household first.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Chore</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Create from Scratch</h2>
          <ChoreForm onSubmit={handleCreateChore} onCancel={() => router.push('/chores')} initialData={selectedTemplate} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Use a Template</h2>
          <ChoreTemplateList onSelectTemplate={handleTemplateSelect} />
        </div>
      </div>
    </div>
  );
}
