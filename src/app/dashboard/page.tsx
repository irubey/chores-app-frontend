"use client";

import React from "react";
import { useHousehold } from "@/hooks/useHousehold";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/api/logger";
import HouseholdCard from "@/components/household/HouseholdCard";
import CreateHouseholdButton from "@/components/household/CreateHouseholdButton";

export default function DashboardPage() {
  const { user } = useAuth();
  const { userHouseholds, status } = useHousehold();

  logger.debug("Dashboard render state", {
    hasUser: !!user,
    householdsCount: userHouseholds.length,
    status,
  });

  if (!user) {
    logger.debug("Dashboard waiting for user");
    return null;
  }

  const isLoading = status.list === "loading" && userHouseholds.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-h2">Your Households</h1>
        <CreateHouseholdButton />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
          </div>
        </div>
      ) : userHouseholds.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-h4 mb-4">No households yet</h2>
          <p className="text-text-secondary mb-8">
            Create your first household to get started
          </p>
        </div>
      ) : (
        <div className="grid-auto-fit gap-6">
          {userHouseholds.map((household) => (
            <HouseholdCard key={household.id} household={household} />
          ))}
        </div>
      )}
    </div>
  );
}
