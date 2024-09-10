'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useHousehold } from '../../hooks/useHousehold';
import { useChores } from '../../hooks/useChores';

const QuickActionPanel: React.FC = () => {
  const router = useRouter();
  const { currentHousehold } = useHousehold();
  const { createChore } = useChores();

  const handleCreateChore = () => {
    router.push('/chores/create');
  };

  const handleViewAllChores = () => {
    router.push('/chores');
  };

  const handleManageHousehold = () => {
    if (currentHousehold) {
      router.push(`/household/${currentHousehold.id}`);
    } else {
      router.push('/household/create');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-4">
        <button
          onClick={handleCreateChore}
          className="btn btn-primary w-full"
        >
          Create New Chore
        </button>
        <button
          onClick={handleViewAllChores}
          className="btn btn-secondary w-full"
        >
          View All Chores
        </button>
        <button
          onClick={handleManageHousehold}
          className="btn btn-accent w-full"
        >
          {currentHousehold ? 'Manage Household' : 'Create Household'}
        </button>
      </div>
    </div>
  );
};

export default QuickActionPanel;
