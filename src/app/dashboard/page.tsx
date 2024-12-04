"use client";

import React from "react";
import HouseholdsGrid from "@/components/household/HouseholdsGrid";
import CreateHouseholdButton from "@/components/household/CreateHouseholdButton";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/api/logger";

export default function DashboardPage() {
  const { user } = useAuth();

  logger.debug("Dashboard render state", {
    hasUser: !!user,
  });

  if (!user) {
    logger.debug("Dashboard waiting for user");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-h2">Your Households</h1>
        <CreateHouseholdButton />
      </div>

      <HouseholdsGrid />
    </div>
  );
}
