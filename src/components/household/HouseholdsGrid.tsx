import React from "react";
import { useHouseholds } from "@/contexts/HouseholdsContext";
import HouseholdCard from "./HouseholdCardContainer";
import { logger } from "@/lib/api/logger";
import { HouseholdWithMembers, HouseholdMemberWithUser } from "@shared/types";

type HouseholdWithInvitation = HouseholdWithMembers & {
  isPending?: boolean;
  invitationId?: string;
};

export default function HouseholdsGrid() {
  const {
    userHouseholds: households,
    pendingInvitations,
    handleInvitationResponse,
    status,
  } = useHouseholds();

  // Debug raw pending invitations
  logger.debug("Raw pending invitations", {
    count: pendingInvitations.length,
    invitations: pendingInvitations.map((inv) => ({
      id: inv.id,
      hasHousehold: !!inv.household,
      householdId: inv.household?.id,
    })),
  });

  // Combine regular households and pending invitations
  const allHouseholds: HouseholdWithInvitation[] = [
    ...households,
    ...pendingInvitations
      .filter((invitation) => {
        const isValid = !!invitation.household?.id;
        if (!isValid) {
          logger.debug("Filtered out invitation", {
            id: invitation.id,
            hasHousehold: !!invitation.household,
            householdId: invitation.household?.id,
          });
        }
        return isValid;
      })
      .map((invitation) => ({
        ...invitation.household!,
        isPending: true,
        invitationId: invitation.id,
      })),
  ];

  logger.debug("Rendering HouseholdsGrid", {
    householdsCount: households.length,
    pendingCount: pendingInvitations.length,
    validPendingCount: pendingInvitations.filter((inv) => !!inv.household?.id)
      .length,
    totalCount: allHouseholds.length,
  });

  if (status.list === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {allHouseholds.map((household) => (
        <HouseholdCard
          key={`${household.isPending ? "invitation" : "household"}-${
            household.id
          }`}
          household={household}
          isPending={household.isPending}
          memberId={household.invitationId}
        />
      ))}
    </div>
  );
}
