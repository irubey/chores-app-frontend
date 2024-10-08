"use client";

import React from "react";
import { useHousehold } from "../../hooks/useHousehold";
import { useAuth } from "../../hooks/useAuth";
import DashboardSummary from "../../components/dashboard/DashboardSummary";
import QuickActionPanel from "../../components/dashboard/QuickActionPanel";
import UpcomingChores from "../../components/dashboard/UpcomingChores";
import HouseholdSelector from "../../components/household/HouseholdSelector";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function DashboardPage() {
  const { user, status: authStatus } = useAuth();
  const { currentHousehold, isLoading: householdLoading } = useHousehold();
  const { theme } = useTheme();

  const errorFallback = (
    <div className="text-red-500 p-4 bg-red-100 rounded-md">
      An error occurred while loading this component. Please try refreshing the
      page.
    </div>
  );

  if (authStatus === "loading" || householdLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className={`p-6 ${
        theme === "dark"
          ? "bg-background-dark text-white"
          : "bg-background-light"
      }`}
    >
      <h1 className="text-h1 mb-6">Welcome, {user?.name}</h1>

      <ErrorBoundary fallback={errorFallback}>
        <HouseholdSelector user={user} />
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
