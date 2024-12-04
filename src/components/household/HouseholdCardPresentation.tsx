import React from "react";
import { HouseholdWithMembers } from "@shared/types";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import HouseholdStats from "./HouseholdStats";
import MembersList from "./MembersList";
import { logger } from "@/lib/api/logger";

interface HouseholdCardPresentationProps {
  household: HouseholdWithMembers;
  isAdmin: boolean;
  currentUserId?: string;
  isPending?: boolean;
  onManageClick?: () => void;
}

export default function HouseholdCardPresentation({
  household,
  isAdmin,
  currentUserId,
  isPending = false,
  onManageClick,
}: HouseholdCardPresentationProps) {
  const members = household.members || [];

  logger.debug("Rendering household card presentation", {
    householdId: household.id,
    isAdmin,
    isPending,
    membersCount: members.length,
  });

  return (
    <Card
      className={`relative transition-all duration-200 cursor-pointer hover:shadow-lg ${
        isPending ? "border-2 border-primary/20" : ""
      }`}
      onClick={onManageClick}
    >
      {isPending && (
        <Badge
          count={1}
          color="primary"
          className="absolute -top-2 -right-2"
          dot
        />
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-h3">{household.name}</h3>
          {isPending && (
            <span className="text-sm text-primary mt-1">
              Click to view and respond to invitation
            </span>
          )}
        </div>
        {isAdmin && !isPending && (
          <Button
            variant="ghost"
            className="text-primary dark:text-primary-light"
            onClick={(e) => {
              e.stopPropagation();
              onManageClick?.();
            }}
          >
            Manage
          </Button>
        )}
      </div>

      <HouseholdStats
        stats={{
          expenses: 0,
          messages: 0,
          tasks: 0,
          events: 0,
        }}
        className="mb-4"
      />

      <MembersList
        members={members}
        currentUserId={currentUserId}
        maxDisplay={5}
        className="space-y-4"
      />
    </Card>
  );
}
