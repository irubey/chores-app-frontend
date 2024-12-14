import React from "react";
import { HouseholdWithMembers } from "@shared/types/household";
import { logger } from "@/lib/api/logger";
import { useSetActiveHousehold } from "@/hooks/users/useUser";
import HouseholdCardPresentation from "./HouseholdCardPresentation";

interface HouseholdCardContainerProps {
  household: HouseholdWithMembers;
  activeHouseholdId: string | undefined;
}

export default function HouseholdCardContainer({
  household,
  activeHouseholdId,
}: HouseholdCardContainerProps) {
  const memberCount = household.members?.length ?? 0;
  const isActive = household.id === activeHouseholdId;

  const {
    mutate: setActiveHousehold,
    isPending,
    variables,
  } = useSetActiveHousehold();
  const isThisHouseholdPending = isPending && variables === household.id;

  logger.debug("Rendering household card container", {
    householdId: household.id,
    name: household.name,
    memberCount,
    isActive,
    isPending: isThisHouseholdPending,
    activeHouseholdId,
  });

  const handleSelect = () => {
    if (isThisHouseholdPending || isActive) return;

    logger.debug("Setting active household", {
      householdId: household.id,
      name: household.name,
    });

    setActiveHousehold(household.id);
  };

  return (
    <HouseholdCardPresentation
      household={household}
      memberCount={memberCount}
      onSelect={handleSelect}
      isActive={isActive}
      isPending={isThisHouseholdPending}
    />
  );
}
