import React from "react";
import { HouseholdWithMembers } from "@shared/types/household";
import HouseholdCardContainer from "./HouseholdCardContainer";
import { logger } from "@/lib/api/logger";

interface HouseholdsGridProps {
  households?: HouseholdWithMembers[];
  isLoading: boolean;
}

export default function HouseholdsGrid({
  households,
  isLoading,
}: HouseholdsGridProps) {
  logger.debug("Rendering HouseholdsGrid", {
    householdsCount: households?.length ?? 0,
    isLoading,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!households?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          You don't have any households yet. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {households.map((household) => (
        <HouseholdCardContainer key={household.id} household={household} />
      ))}
    </div>
  );
}
