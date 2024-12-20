import React from "react";
import { HouseholdMemberWithUser } from "@shared/types";
import { cn } from "@/lib/utils";

interface MentionDropdownProps {
  participants: HouseholdMemberWithUser[];
  searchText: string;
  selectedIndex: number;
  onSelect: (participant: HouseholdMemberWithUser) => void;
  position: { top: number; left: number };
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  participants,
  searchText,
  selectedIndex,
  onSelect,
  position,
}) => {
  const filteredParticipants = participants.filter(
    (p) =>
      p.user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.nickname?.toLowerCase().includes(searchText.toLowerCase())
  );

  if (!filteredParticipants.length) return null;

  return (
    <div
      className="absolute z-10 bg-white dark:bg-background-dark shadow-lg rounded-md border border-neutral-200 dark:border-neutral-700 max-h-48 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {filteredParticipants.map((participant, index) => (
        <button
          key={participant.userId}
          className={cn(
            "w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800",
            index === selectedIndex && "bg-neutral-100 dark:bg-neutral-800"
          )}
          onClick={() => onSelect(participant)}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{participant.user.name}</span>
            {participant.nickname && (
              <span className="text-sm text-text-secondary">
                ({participant.nickname})
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
