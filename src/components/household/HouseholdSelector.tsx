import React from "react";
import { HouseholdWithMembers } from "@shared/types/household";
import { logger } from "@/lib/api/logger";
import HouseholdCardContainer from "./HouseholdCardContainer";

interface HouseholdSelectorProps {
  households: HouseholdWithMembers[] | undefined;
  isLoading: boolean;
  className?: string;
}

export default function HouseholdSelector({
  households,
  isLoading,
  className = "",
}: HouseholdSelectorProps) {
  logger.debug("Rendering HouseholdSelector", {
    householdsCount: households?.length ?? 0,
    isLoading,
  });

  // Only show if there are multiple households
  if (!households || households.length <= 1 || isLoading) {
    return null;
  }

  return (
    <div className={`w-full bg-white dark:bg-gray-800 shadow-sm ${className}`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          {households.map((household) => (
            <div key={household.id} className="flex-shrink-0">
              <HouseholdCardContainer household={household} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
