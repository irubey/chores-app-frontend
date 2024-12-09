import React from "react";
import Link from "next/link";
import { HouseholdWithMembers } from "@shared/types/household";

interface HouseholdCardPresentationProps {
  household: HouseholdWithMembers;
  memberCount: number;
  onSelect?: () => void;
}

export default function HouseholdCardPresentation({
  household,
  memberCount,
  onSelect,
}: HouseholdCardPresentationProps) {
  return (
    <Link
      href={`/households/${household.id}`}
      onClick={onSelect}
      className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {household.name}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium mr-2">Currency:</span>
          {household.currency}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium mr-2">Language:</span>
          {household.language}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium mr-2">Timezone:</span>
          {household.timezone}
        </div>
      </div>
    </Link>
  );
}
