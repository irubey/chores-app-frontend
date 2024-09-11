'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import UserInfoSection from '@/components/profile/UserInfoSection';
import HouseholdSection from '@/components/profile/HouseholdSection';
import PreferencesSection from '@/components/profile/PreferencesSection';
// import BadgesSection from '@/components/profile/BadgesSection';
// import CalendarIntegrationSection from '@/components/profile/CalendarIntegrationSection';
// import AccountStatsSection from '@/components/profile/AccountStatsSection';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: householdLoading } = useHousehold();
  const [preferences, setPreferences] = useState(null);
  const [badges, setBadges] = useState([]);
  const [calendarIntegration, setCalendarIntegration] = useState(null);
  const [accountStats, setAccountStats] = useState(null);

  if (authLoading || householdLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <UserInfoSection/>
      <HouseholdSection/>
      <PreferencesSection/>
      {/* <BadgesSection badges={badges} />
      <CalendarIntegrationSection integration={calendarIntegration} />
      <AccountStatsSection stats={accountStats} /> */}
    </div>
  );
}
