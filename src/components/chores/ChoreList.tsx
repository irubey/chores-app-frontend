import React, { useMemo } from 'react';
import { Chore } from '../../hooks/useChores';
import ChoreItem from './ChoreItem';
import { useAuth } from '@/hooks/useAuth';

interface ChoreListProps {
  chores: Chore[];
  onEdit: (chore: Chore) => void;
  onDelete: (choreId: string) => void;
  onComplete: (choreId: string) => void;
}

const ChoreList: React.FC<ChoreListProps> = ({ chores, onEdit, onDelete, onComplete }) => {
  const { user } = useAuth();

  const sortChores = (choreList: Chore[]) => {
    return choreList.sort((a, b) => {
      if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
      if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    });
  };

  const { userChores, householdChores } = useMemo(() => {
    const userChores: Chore[] = [];
    const householdChores: Chore[] = [];

    chores.forEach(chore => {
      if (chore.assignedTo === user?.id) {
        userChores.push(chore);
      } else {
        householdChores.push(chore);
      }
    });

    return {
      userChores: sortChores(userChores),
      householdChores: sortChores(householdChores)
    };
  }, [chores, user]);

  const renderChoreSection = (sectionChores: Chore[], title: string) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <ul className="space-y-4">
        {sectionChores.map((chore) => (
          <ChoreItem
            key={chore.id}
            chore={chore}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
          />
        ))}
      </ul>
    </div>
  );

  return (
    <div>
      {renderChoreSection(userChores, "Your Chores")}
      {renderChoreSection(householdChores, "Household Chores")}
    </div>
  );
};

export default ChoreList;
