'use client'

import React, { useState } from 'react';
import { ChoreTemplate } from '@/hooks/useChoreTemplates';
import ChoreForm from '@/components/chores/ChoreForm';
import ChoreTemplateList from '@/components/templates/ChoreTemplateList';
import { useHousehold } from '@/hooks/useHousehold';
import { useChores } from '@/hooks/useChores';
import { useRouter } from 'next/navigation';

export default function CreateChorePage() {
  const { currentHousehold } = useHousehold();
  const { createChore } = useChores();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<ChoreTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateChore = async (choreData: any) => {
    try {
      if (currentHousehold) {
        await createChore({ ...choreData, householdId: currentHousehold.id });
        router.push('/chores');
      } else {
        setError('No household selected');
      }
    } catch (error) {
      console.error('Error creating chore:', error);
      setError('Failed to create chore. Please try again.');
    }
  };

  const handleTemplateSelect = (template: ChoreTemplate) => {
    setSelectedTemplate(template);
  };

  if (!currentHousehold) {
    return <div>Please select a household first.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Chore</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Create Chore</h2>
          <ChoreForm
            onSubmit={handleCreateChore}
            onCancel={() => router.push('/chores')}
            initialData={selectedTemplate}
            householdMembers={currentHousehold.members}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Use a Template</h2>
          <ChoreTemplateList
            onSelectTemplate={handleTemplateSelect}
            selectedTemplate={selectedTemplate}
          />
        </div>
      </div>
    </div>
  );
}
