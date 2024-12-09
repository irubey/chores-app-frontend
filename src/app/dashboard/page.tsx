"use client";

import React from "react";
import { useAuthUser } from "@/contexts/UserContext";
import { logger } from "@/lib/api/logger";
import { useHouseholds } from "@/hooks/useHouseholds";
import HouseholdsGrid from "@/components/household/HouseholdsGrid";
import CreateHouseholdButton from "@/components/household/CreateHouseholdButton";

export default function DashboardPage() {
  const user = useAuthUser();
  const { data: households, isLoading, error } = useHouseholds();

  logger.debug("Dashboard render state", {
    hasUser: !!user,
    householdsCount: households?.data?.length ?? 0,
    isLoading,
    hasError: !!error,
  });

  if (!user) {
    logger.debug("Dashboard waiting for user");
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Error loading households
          </h2>
          <p className="text-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-h2">Your Households</h1>
        <CreateHouseholdButton />
      </div>

      <HouseholdsGrid households={households?.data} isLoading={isLoading} />
    </div>
  );
}
