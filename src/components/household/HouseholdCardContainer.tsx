import React from "react";
import { useRouter } from "next/navigation";
import { HouseholdWithMembers } from "@shared/types/household";
import { logger } from "@/lib/api/logger";
import HouseholdCardPresentation from "./HouseholdCardPresentation";

interface HouseholdCardContainerProps {
  household: HouseholdWithMembers;
}

export default function HouseholdCardContainer({
  household,
}: HouseholdCardContainerProps) {
  const router = useRouter();
  const memberCount = household.members?.length ?? 0;

  logger.debug("Rendering household card container", {
    householdId: household.id,
    name: household.name,
    memberCount,
  });

  const handleSelect = () => {
    logger.debug("Household card selected", {
      householdId: household.id,
      name: household.name,
    });
    router.push(`/household/${household.id}`);
  };

  return (
    <HouseholdCardPresentation
      household={household}
      memberCount={memberCount}
      onSelect={handleSelect}
    />
  );
}
