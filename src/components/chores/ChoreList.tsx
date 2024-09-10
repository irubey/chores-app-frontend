import React from 'react';
import { Chore } from '../../hooks/useChores';

interface ChoreListProps {
  chores: Chore[];
  onEdit: (chore: Chore) => void;
  onDelete: (choreId: string) => void;
  onComplete: (choreId: string) => void;
}

const ChoreList: React.FC<ChoreListProps> = ({ chores, onEdit, onDelete, onComplete }) => {
  const isChoreOverdue = (chore: Chore) => {
    if (!chore.dueDate) return false;
    const dueDate = new Date(chore.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  return (
    <ul className="space-y-4">
      {chores.map((chore) => (
        <li key={chore.id} className="border p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{chore.title}</h3>
              <p className="text-gray-600">{chore.description}</p>
              <p className="text-sm">
                Frequency: {chore.frequency}, Time Estimate: {chore.timeEstimate} minutes
              </p>
              <p className={`text-sm ${isChoreOverdue(chore) ? 'text-red-500' : 'text-green-500'}`}>
                Due: {chore.dueDate ? new Date(chore.dueDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => onEdit(chore)}
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(chore.id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
              >
                Delete
              </button>
              <button
                onClick={() => onComplete(chore.id)}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
              >
                Complete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ChoreList;
