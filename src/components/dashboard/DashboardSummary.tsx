import React from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store/slices/authSlice';
import { selectChores } from '../../store/slices/choresSlice';
import { selectFinances } from '../../store/slices/financesSlice';
import { selectNotifications } from '../../store/slices/notificationsSlice';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../common/LoadingSpinner';

const DashboardSummary: React.FC = () => {
  const { user } = useSelector(selectAuth);
  const { chores, isLoading: choresLoading } = useSelector(selectChores);
  const { expenses, isLoading: financesLoading } = useSelector(selectFinances);
  const { notifications, isLoading: notificationsLoading } = useSelector(selectNotifications);
  const { theme } = useTheme();

  if (choresLoading || financesLoading || notificationsLoading) {
    return <LoadingSpinner />;
  }

  const pendingChores = chores.filter(chore => chore.status === 'PENDING').length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const unreadNotifications = notifications.filter(notification => !notification.isRead).length;

  return (
    <div className={`p-6 rounded-lg shadow-md ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-white'}`}>
      <h2 className="text-h2 mb-4">Household Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-h4 font-bold">{pendingChores}</p>
          <p className="text-sm">Pending Chores</p>
        </div>
        <div className="text-center">
          <p className="text-h4 font-bold">${totalExpenses.toFixed(2)}</p>
          <p className="text-sm">Total Expenses</p>
        </div>
        <div className="text-center">
          <p className="text-h4 font-bold">{unreadNotifications}</p>
          <p className="text-sm">Unread Notifications</p>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-sm">Welcome back, {user?.name}! Here's what's happening in your household.</p>
      </div>
    </div>
  );
};

export default DashboardSummary;