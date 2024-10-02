import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../common/LoadingSpinner';
import useDashboardData from '../../hooks/useDashboardData';

const DashboardSummary: React.FC = () => {
  const { theme } = useTheme();
  const { user, isLoading, pendingChores, totalExpenses, unreadNotifications } = useDashboardData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

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