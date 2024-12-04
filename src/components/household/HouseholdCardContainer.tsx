import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { HouseholdWithMembers } from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { logger } from "@/lib/api/logger";
import HouseholdCardPresentation from "./HouseholdCardPresentation";

export interface HouseholdCardContainerProps {
  household: HouseholdWithMembers & {
    isPending?: boolean;
    invitationId?: string;
  };
  isPending?: boolean;
  memberId?: string;
}

export default function HouseholdCardContainer({
  household,
  isPending = false,
  memberId,
}: HouseholdCardContainerProps) {
  const router = useRouter();
  const { user } = useAuth();

  // For pending invitations, members might not be populated
  const members = household.members || [];
  const isAdmin = isPending
    ? false
    : members.find((m) => m.userId === user?.id)?.role === HouseholdRole.ADMIN;

  logger.debug("Rendering household card container", {
    householdId: household.id,
    isAdmin,
    userId: user?.id,
    isPending,
    membersCount: members.length,
  });

  const handleManageClick = () => {
    logger.debug("Navigating to household management", {
      householdId: household.id,
      isPending,
      memberId,
    });

    // Pass invitation info in the URL if this is a pending invitation
    const queryParams = isPending ? `?invitation=${memberId}` : "";
    router.push(`/household/${household.id}${queryParams}`);
  };

  return (
    <HouseholdCardPresentation
      household={{
        ...household,
        members,
      }}
      isAdmin={isAdmin}
      currentUserId={user?.id}
      isPending={isPending}
      onManageClick={handleManageClick}
    />
  );
}
