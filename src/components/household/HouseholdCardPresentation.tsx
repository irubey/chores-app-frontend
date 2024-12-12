import React from "react";
import { HouseholdWithMembers } from "@shared/types/household";

interface HouseholdCardPresentationProps {
  household: HouseholdWithMembers;
  memberCount: number;
  onSelect: () => void;
  isActive: boolean;
  isPending: boolean;
}

export default function HouseholdCardPresentation({
  household,
  memberCount,
  onSelect,
  isActive,
  isPending,
}: HouseholdCardPresentationProps) {
  return (
    <div
      className={`cursor-pointer rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg ${
        isActive ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {household.name}
          </h3>
          <p className="text-sm text-gray-500">{memberCount} members</p>
        </div>
        {isPending ? (
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
        ) : (
          <div
            className={`h-3 w-3 rounded-full ${
              isActive ? "bg-primary" : "bg-gray-300"
            }`}
          />
        )}
      </div>
    </div>
  );
}
