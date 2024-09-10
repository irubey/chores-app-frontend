'use client'

import React from 'react';
import { useChores, Chore } from '../../hooks/useChores';
import { useHousehold } from '../../hooks/useHousehold';

const RecentActivityFeed: React.FC = () => {
  const { chores } = useChores();
  const { currentHousehold } = useHousehold();

  const recentCompletedChores = chores
    .filter(chore => chore.status === 'COMPLETED')
    .sort((a, b) => new Date(b.lastCompleted!).getTime() - new Date(a.lastCompleted!).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      {recentCompletedChores.length > 0 ? (
        <ul className="space-y-4">
          {recentCompletedChores.map((chore: Chore) => (
            <li key={chore.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <span className="inline-block h-8 w-8 rounded-full bg-green-100 text-green-500 flex items-center justify-center">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <div className="flex-grow">
                <p className="text-sm font-medium text-gray-900">{chore.title}</p>
                <p className="text-sm text-gray-500">
                  Completed by {currentHousehold?.members.find(member => member.id === chore.assignedTo)?.name || 'Unknown'}
                </p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                {chore.lastCompleted && new Date(chore.lastCompleted).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No recent activity</p>
      )}
    </div>
  );
};

export default RecentActivityFeed;
