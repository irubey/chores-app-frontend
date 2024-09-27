'use client'

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store/slices/authSlice';
import { useRouter } from 'next/navigation';
import DashboardSummary from '../../components/dashboard/DashboardSummary';
import QuickActionPanel from '../../components/dashboard/QuickActionPanel';
import UpcomingChores from '../../components/dashboard/UpcomingChores';
import HouseholdSelector from '../../components/household/HouseholdSelector';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useSelector(selectAuth);
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return <LoadingSpinner />;
  }

  const errorFallback = (
    <div className="text-red-500 p-4 bg-red-100 rounded-md">
      An error occurred while loading this component. Please try refreshing the page.
    </div>
  );

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-background-dark text-white' : 'bg-background-light'}`}>
      <h1 className="text-h1 mb-6">Welcome, {user.name}</h1>
      
      <ErrorBoundary fallback={errorFallback}>
        <HouseholdSelector />
      </ErrorBoundary>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ErrorBoundary fallback={errorFallback}>
          <DashboardSummary />
        </ErrorBoundary>

        <ErrorBoundary fallback={errorFallback}>
          <QuickActionPanel />
        </ErrorBoundary>

        <ErrorBoundary fallback={errorFallback}>
          <UpcomingChores />
        </ErrorBoundary>
      </div>
    </div>
  );
}