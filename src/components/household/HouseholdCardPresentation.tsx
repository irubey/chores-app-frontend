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
    <button
      onClick={onSelect}
      disabled={isPending}
      className={`
        inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200 border-2
        ${
          isActive
            ? "bg-primary text-white border-primary hover:bg-primary-dark hover:border-primary-dark"
            : "bg-white text-primary border-gray-200 hover:border-primary hover:text-primary-dark"
        }
        ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span className="truncate max-w-[150px]">{household.name}</span>
      {isPending && (
        <div className="ml-2 h-3 w-3 animate-spin rounded-full border-b-2 border-white" />
      )}
    </button>
  );
}
