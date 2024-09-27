import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectChores, fetchChores, updateChore } from '../../store/slices/choresSlice';
import { selectAuth } from '../../store/slices/authSlice';
import { Chore, ChoreStatus } from '../../types/chore';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { AppDispatch } from '../../store/store';

const UpcomingChores: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { chores, isLoading, isError, message } = useSelector(selectChores);
  const { user } = useSelector(selectAuth);
  const { theme } = useTheme();

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchChores(user.id));
    }
  }, [dispatch, user?.id]);

  const upcomingChores = chores.filter(chore => 
    chore.status !== ChoreStatus.COMPLETED && 
    chore.assignedUserIds?.includes(user?.id || '')
  ).sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime());

  const handleCompleteChore = (choreId: string) => {
    if (user?.id) {
      dispatch(updateChore({
        householdId: user.id,
        choreId,
        choreData: { status: ChoreStatus.COMPLETED }
      }));
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading upcoming chores...</div>;
  }

  if (isError) {
    return <div className="text-red-500">Error: {message}</div>;
  }

  return (
    <div className={`p-4 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h2 className="text-h2 mb-4">Upcoming Chores</h2>
      {upcomingChores.length === 0 ? (
        <p>No upcoming chores. Great job!</p>
      ) : (
        <ul className="space-y-4">
          {upcomingChores.map((chore: Chore) => (
            <li key={chore.id} className="flex items-center justify-between">
              <div>
                <h3 className="text-h5">{chore.title}</h3>
                <p className="text-sm text-gray-500">Due: {chore.dueDate ? new Date(chore.dueDate).toLocaleDateString() : 'No due date'}</p>
              </div>
              <Button
                onClick={() => handleCompleteChore(chore.id)}
                className="btn-primary"
              >
                Complete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingChores;