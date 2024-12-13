"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useHouseholds } from "@/hooks/households/useHouseholds";
import { useUser } from "@/hooks/users/useUser";
import { logger } from "@/lib/api/logger";
import CreateHouseholdButton from "@/components/household/CreateHouseholdButton";

export default function DashboardPage() {
  const router = useRouter();
  const { data: userData } = useUser();
  const activeHouseholdId = userData?.data?.activeHouseholdId;

  const { data: householdsResponse, isLoading, error } = useHouseholds();

  const households = householdsResponse?.data;
  const activeHousehold = households?.find((h) => h.id === activeHouseholdId);

  logger.debug("Dashboard render state", {
    hasUser: !!userData?.data,
    activeHouseholdId,
    hasActiveHousehold: !!activeHousehold,
    householdsCount: households?.length ?? 0,
    isLoading,
    hasError: !!error,
  });

  const handleViewHousehold = () => {
    if (activeHouseholdId) {
      router.push(`/household/${activeHouseholdId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">Error loading data</h2>
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-h2">Dashboard</h1>
          {activeHousehold && (
            <button
              onClick={handleViewHousehold}
              className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium
                bg-primary text-white hover:bg-primary-dark transition-all duration-200"
            >
              <span className="truncate max-w-[200px]">
                {activeHousehold.name}
              </span>
              <span className="ml-2 text-xs opacity-75">
                {activeHousehold.members?.length || 0} members
              </span>
            </button>
          )}
        </div>
        <CreateHouseholdButton />
      </div>

      {/* Add dashboard content here */}
    </div>
  );
}
