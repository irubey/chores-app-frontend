'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import ChoreDistributionChart from '@/components/dashboard/ChoreDistributionChart';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import QuickActionPanel from '@/components/dashboard/QuickActionPanel';
import UpcomingChores from '@/components/dashboard/UpcomingChores';
import { useHousehold } from '@/hooks/useHousehold';
import { useChores } from '@/hooks/useChores';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const router = useRouter();
  const { currentHousehold, isLoading } = useHousehold();
  const { chores } = useChores();

  useEffect(() => {
    if (!isLoading && !currentHousehold) {
      router.push('/household/create');
    }
  }, [currentHousehold, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentHousehold) {
    return null; // This will prevent any flash of content before redirect
  }

  const showChoreDistributionChart = chores.length > 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <DashboardSummary />
        </div>
        {showChoreDistributionChart && (
          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <ChoreDistributionChart />
          </div>
        )}
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <RecentActivityFeed />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <QuickActionPanel />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <UpcomingChores />
        </div>
      </div>
    </main>
  );
}