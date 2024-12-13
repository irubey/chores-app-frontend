import React, { memo } from "react";
import { HouseholdWithMembers } from "@shared/types/household";
import { logger } from "@/lib/api/logger";
import HouseholdCardContainer from "./HouseholdCardContainer";

interface HouseholdSelectorProps {
  households: HouseholdWithMembers[] | undefined;
  isLoading: boolean;
  className?: string;
}

function HouseholdSelector({
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

// Memoize the component to prevent unnecessary renders
export default memo(HouseholdSelector, (prevProps, nextProps) => {
  // Only re-render if the households array changes or loading state changes
  const prevCount = prevProps.households?.length ?? 0;
  const nextCount = nextProps.households?.length ?? 0;

  if (prevCount !== nextCount || prevProps.isLoading !== nextProps.isLoading) {
    return false; // Re-render
  }

  // If counts match, check if the household IDs are the same
  if (prevProps.households && nextProps.households) {
    return prevProps.households.every(
      (h, i) => h.id === nextProps.households![i].id
    );
  }

  return true; // Don't re-render
});
