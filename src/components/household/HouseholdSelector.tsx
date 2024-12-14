import React, { memo } from "react";
import { HouseholdWithMembers } from "@shared/types/household";
import { logger } from "@/lib/api/logger";
import HouseholdCardContainer from "./HouseholdCardContainer";

interface HouseholdSelectorProps {
  households: HouseholdWithMembers[] | undefined;
  isLoading: boolean;
  activeHouseholdId: string | undefined;
  className?: string;
}

function HouseholdSelector({
  households,
  isLoading,
  activeHouseholdId,
  className = "",
}: HouseholdSelectorProps) {
  logger.debug("Rendering HouseholdSelector", {
    householdsCount: households?.length ?? 0,
    isLoading,
    activeHouseholdId,
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
              <HouseholdCardContainer
                household={household}
                activeHouseholdId={activeHouseholdId}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Memoize the component with updated comparison
export default memo(HouseholdSelector, (prevProps, nextProps) => {
  // Compare loading state
  if (prevProps.isLoading !== nextProps.isLoading) {
    return false;
  }

  // Compare active household
  if (prevProps.activeHouseholdId !== nextProps.activeHouseholdId) {
    return false;
  }

  // Compare households
  const prevCount = prevProps.households?.length ?? 0;
  const nextCount = nextProps.households?.length ?? 0;

  if (prevCount !== nextCount) {
    return false;
  }

  // If counts match, check if the household IDs are the same
  if (prevProps.households && nextProps.households) {
    const prevIds = prevProps.households.map((h) => h.id).join(",");
    const nextIds = nextProps.households.map((h) => h.id).join(",");
    return prevIds === nextIds;
  }

  return true;
});
