import React from "react";
import { HouseholdMemberWithUser } from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { logger } from "@/lib/api/logger";
import Button from "@/components/common/Button";
import { FaCrown, FaUserCog, FaTrash } from "react-icons/fa";

interface MembersListProps {
  members: HouseholdMemberWithUser[];
  currentUserId?: string;
  maxDisplay?: number;
  className?: string;
  isAdmin?: boolean;
  onUpdateRole?: (member: HouseholdMemberWithUser) => void;
  onRemoveMember?: (memberId: string) => void;
}

export default function MembersList({
  members,
  currentUserId,
  maxDisplay = 5,
  className,
  isAdmin = false,
  onUpdateRole,
  onRemoveMember,
}: MembersListProps) {
  logger.debug("Rendering members list", {
    membersCount: members.length,
    currentUserId,
    maxDisplay,
    isAdmin,
  });

  // Separate accepted and pending members
  const acceptedMembers = members
    .filter((m) => m.isAccepted && "user" in m)
    .sort((a, b) =>
      a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : 0
    );

  const pendingMembers = members
    .filter((m) => !m.isAccepted && "user" in m)
    .slice(0, maxDisplay);

  // Calculate remaining counts
  const remainingAccepted = Math.max(acceptedMembers.length - maxDisplay, 0);
  const remainingPending = Math.max(
    members.filter((m) => !m.isAccepted).length - maxDisplay,
    0
  );

  return (
    <div className={className}>
      <h4 className="text-h4 text-text-primary dark:text-text-secondary mb-4">
        Members
      </h4>
      <ul className="space-y-2">
        {/* Accepted Members */}
        {acceptedMembers.slice(0, maxDisplay).map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-background-dark border border-neutral-200 dark:border-neutral-700 rounded-md transition-shadow duration-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary dark:bg-secondary-light" />
              <div>
                <span className="font-medium text-text-primary dark:text-text-secondary">
                  {member.user?.name || "Unknown"}
                  {member.userId === currentUserId && " (You)"}
                </span>
                {member.role === HouseholdRole.ADMIN && (
                  <span className="ml-2 text-xs text-primary dark:text-primary-light">
                    (Admin)
                  </span>
                )}
              </div>
            </div>
            {isAdmin && member.userId !== currentUserId && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="btn-icon text-primary dark:text-primary-light"
                  onClick={() => onUpdateRole?.(member)}
                >
                  {member.role === HouseholdRole.ADMIN ? (
                    <FaCrown className="h-4 w-4" />
                  ) : (
                    <FaUserCog className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="btn-icon text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  onClick={() => onRemoveMember?.(member.id)}
                >
                  <FaTrash className="h-4 w-4" />
                </Button>
              </div>
            )}
          </li>
        ))}
        {remainingAccepted > 0 && (
          <li className="text-sm text-text-secondary italic px-3">
            +{remainingAccepted} more members
          </li>
        )}

        {/* Pending Members */}
        {pendingMembers.length > 0 && (
          <>
            <li className="text-h5 text-text-primary dark:text-text-secondary mt-6 mb-3">
              Pending Invites
            </li>
            {pendingMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between p-3 bg-white/50 dark:bg-background-dark/50 border border-neutral-200 dark:border-neutral-700 rounded-md transition-shadow duration-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-accent/50 dark:bg-accent-light/50" />
                  <div>
                    <span className="text-text-secondary dark:text-text-secondary/70">
                      {member.user?.name || member.user?.email || "Unknown"}
                    </span>
                    <span className="ml-2 text-xs text-accent dark:text-accent-light">
                      (Pending)
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    className="btn-icon text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    onClick={() => onRemoveMember?.(member.id)}
                  >
                    <FaTrash className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
            {remainingPending > 0 && (
              <li className="text-sm text-text-secondary/70 italic px-3">
                +{remainingPending} more pending invites
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
}
