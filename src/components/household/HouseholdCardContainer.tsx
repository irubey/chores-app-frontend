import React from "react";
import { HouseholdWithMembers } from "@shared/types/household";
import { logger } from "@/lib/api/logger";
import { useSetActiveHousehold } from "@/hooks/users/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/lib/api/services/userService";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { User } from "@shared/types";
import HouseholdCardPresentation from "./HouseholdCardPresentation";

interface HouseholdCardContainerProps {
  household: HouseholdWithMembers;
}

export default function HouseholdCardContainer({
  household,
}: HouseholdCardContainerProps) {
  const queryClient = useQueryClient();
  const userData = queryClient.getQueryData<ApiResponse<User>>(
    userKeys.profile()
  );
  const memberCount = household.members?.length ?? 0;
  const isActive = userData?.data?.activeHouseholdId === household.id;

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

    setActiveHousehold(household.id);
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
