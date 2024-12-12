import React from "react";
import { useRouter } from "next/navigation";
import { HouseholdWithMembers } from "@shared/types/household";
import { logger } from "@/lib/api/logger";
import { useSetActiveHousehold } from "@/hooks/households/useHouseholds";
import { useAuthUser } from "@/contexts/UserContext";
import HouseholdCardPresentation from "./HouseholdCardPresentation";

interface HouseholdCardContainerProps {
  household: HouseholdWithMembers;
}

export default function HouseholdCardContainer({
  household,
}: HouseholdCardContainerProps) {
  const router = useRouter();
  const user = useAuthUser();
  const memberCount = household.members?.length ?? 0;
  const isActive = user?.activeHouseholdId === household.id;

  const { mutate: setActiveHousehold, isPending } = useSetActiveHousehold();

  logger.debug("Rendering household card container", {
    householdId: household.id,
    name: household.name,
    memberCount,
    isActive,
  });

  const handleSelect = () => {
    logger.debug("Setting active household", {
      householdId: household.id,
      name: household.name,
    });

    setActiveHousehold(household.id, {
      onSuccess: () => {
        logger.debug("Active household set, navigating to detail", {
          householdId: household.id,
        });
        router.push(`/household/${household.id}`);
      },
    });
  };

  return (
    <HouseholdCardPresentation
      household={household}
      memberCount={memberCount}
      onSelect={handleSelect}
      isActive={isActive}
      isPending={isPending}
    />
  );
}
