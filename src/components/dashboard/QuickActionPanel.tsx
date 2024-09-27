'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';

const QuickActionPanel: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();

  const actions = [
    { label: 'Add Chore', action: () => router.push('/chores/new') },
    { label: 'Add Expense', action: () => router.push('/finances/expenses/new') },
    { label: 'Send Message', action: () => router.push('/messages/new') },
    { label: 'Schedule Event', action: () => router.push('/calendar/new') },
  ];

  return (
    <div className={`p-4 rounded-lg shadow-md ${theme === 'dark' ? 'bg-background-dark text-white' : 'bg-white'}`}>
      <h2 className="text-h4 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={action.action}
            className={`py-2 px-4 rounded-md ${
              theme === 'dark'
                ? 'bg-primary-dark text-white hover:bg-primary'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionPanel;