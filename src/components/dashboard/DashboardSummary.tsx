'use client'

import React from 'react';
import { useHousehold } from '../../hooks/useHousehold';
import { useChores } from '../../hooks/useChores';

const DashboardSummary: React.FC = () => {
  const { currentHousehold } = useHousehold();
  const { chores } = useChores();

  const totalChores = chores.length;
  const completedChores = chores.filter(chore => chore.status === 'COMPLETED').length;
  const pendingChores = totalChores - completedChores;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Household Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-gray-600">Total Chores</p>
          <p className="text-2xl font-bold">{totalChores}</p>
        </div>
        <div>
          <p className="text-gray-600">Completed Chores</p>
          <p className="text-2xl font-bold text-green-600">{completedChores}</p>
        </div>
        <div>
          <p className="text-gray-600">Pending Chores</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingChores}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-gray-600">Current Household</p>
        <p className="text-lg font-semibold">{currentHousehold?.name || 'No household selected'}</p>
      </div>
    </div>
  );
};

export default DashboardSummary;
