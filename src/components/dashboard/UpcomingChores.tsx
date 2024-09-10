'use client'

import React from 'react';
import { useChores, Chore } from '../../hooks/useChores';
import { useHousehold } from '../../hooks/useHousehold';

const UpcomingChores: React.FC = () => {
  const { chores } = useChores();
  const { currentHousehold } = useHousehold();

  const upcomingChores = chores
    .filter(chore => chore.status !== 'COMPLETED' && chore.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Upcoming Chores</h2>
      {upcomingChores.length > 0 ? (
        <ul className="space-y-4">
          {upcomingChores.map((chore: Chore) => (
            <li key={chore.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chore.status)}`}>
                  {chore.status}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{chore.title}</p>
                  <p className="text-sm text-gray-500">
                    Assigned to: {currentHousehold?.members.find(member => member.id === chore.assignedTo)?.name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Due: {chore.dueDate && new Date(chore.dueDate).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No upcoming chores</p>
      )}
    </div>
  );
};

export default UpcomingChores;
