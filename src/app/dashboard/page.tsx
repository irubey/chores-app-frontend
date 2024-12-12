"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/contexts/UserContext";
import { logger } from "@/lib/api/logger";
import { useUserHouseholds } from "@/hooks/households/useHouseholds";
import HouseholdsGrid from "@/components/household/HouseholdsGrid";
import CreateHouseholdButton from "@/components/household/CreateHouseholdButton";
import Spinner from "@/components/common/Spinner";

export default function DashboardPage() {
  const user = useAuthUser();
  const router = useRouter();
  const activeHouseholdId = user?.activeHouseholdId;

  const { data: householdsResponse, isLoading, error } = useUserHouseholds();

  const households = householdsResponse?.data;
  const activeHousehold = households?.find((h) => h.id === activeHouseholdId);

  logger.debug("Dashboard render state", {
    hasUser: !!user,
    activeHouseholdId,
    hasActiveHousehold: !!activeHousehold,
    householdsCount: households?.length ?? 0,
    isLoading,
    hasError: !!error,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Spinner size="large" />
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

  const handleViewActiveHousehold = () => {
    if (activeHouseholdId) {
      router.push(`/household/${activeHouseholdId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {activeHousehold && (
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Active Household</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-primary">
                {activeHousehold.name}
              </p>
              <p className="text-sm text-text-secondary">
                {activeHousehold.members?.length || 0} members
              </p>
            </div>
            <button
              onClick={handleViewActiveHousehold}
              className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-dark"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-h2">Your Households</h1>
        <CreateHouseholdButton />
      </div>

      <HouseholdsGrid households={households} isLoading={isLoading} />
    </div>
  );
}
