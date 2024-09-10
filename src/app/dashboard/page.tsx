import React from 'react';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import ChoreDistributionChart from '@/components/dashboard/ChoreDistributionChart';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import QuickActionPanel from '@/components/dashboard/QuickActionPanel';
import UpcomingChores from '@/components/dashboard/UpcomingChores';

export default function DashboardPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <DashboardSummary />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <ChoreDistributionChart />
        </div>
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