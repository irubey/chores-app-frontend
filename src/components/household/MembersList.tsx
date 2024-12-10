import React from "react";
import { HouseholdMemberWithUser } from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { useUpdateHouseholdMember } from "@/hooks/households/useHouseholds";
import { logger } from "@/lib/api/logger";
import Avatar from "@/components/common/Avatar";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { FaUserShield, FaUserCog, FaUserMinus } from "react-icons/fa";

interface MembersListProps {
  members: HouseholdMemberWithUser[];
  currentUserId: string;
  isAdmin: boolean;
  onUpdateRole?: (member: HouseholdMemberWithUser) => void;
  onRemoveMember?: (memberId: string) => void;
  className?: string;
}

export default function MembersList({
  members,
  currentUserId,
  isAdmin,
  onUpdateRole,
  onRemoveMember,
  className = "",
}: MembersListProps) {
  const updateMemberMutation = useUpdateHouseholdMember();

  // Sort members: Admins first, then by name
  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.role === b.role) {
        return (a.user?.name ?? "").localeCompare(b.user?.name ?? "");
      }
      return a.role === HouseholdRole.ADMIN ? -1 : 1;
    });
  }, [members]);

  const handleRemoveMember = async (member: HouseholdMemberWithUser) => {
    if (!onRemoveMember) return;

    // Don't allow removing yourself or other admins
    if (
      member.userId === currentUserId ||
      member.role === HouseholdRole.ADMIN
    ) {
      return;
    }

    if (
      window.confirm(
        `Remove ${member.user?.name ?? "this member"} from the household?`
      )
    ) {
      onRemoveMember(member.id);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedMembers.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const canManage = isAdmin && !isCurrentUser;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center space-x-4">
              <Avatar
                src={member.user?.profileImageURL}
                alt={member.user?.name ?? "Member"}
                size="md"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">
                    {member.user?.name ?? "Unknown Member"}
                    {isCurrentUser && (
                      <span className="text-text-secondary ml-2">(You)</span>
                    )}
                  </h3>
                  <Badge
                    variant={
                      member.role === HouseholdRole.ADMIN
                        ? "primary"
                        : "secondary"
                    }
                    icon={
                      member.role === HouseholdRole.ADMIN
                        ? FaUserShield
                        : undefined
                    }
                  >
                    {member.role}
                  </Badge>
                  {member.isInvited && !member.isAccepted && (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </div>
                <p className="text-sm text-text-secondary">
                  {member.user?.email ?? "No email"}
                </p>
              </div>
            </div>

            {canManage && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateRole?.(member)}
                  icon={<FaUserCog />}
                  aria-label="Change role"
                  title="Change role"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member)}
                  icon={<FaUserMinus />}
                  className="text-red-500 hover:text-red-600"
                  aria-label="Remove member"
                  title="Remove member"
                  disabled={member.role === HouseholdRole.ADMIN}
                />
              </div>
            )}
          </div>
        );
      })}

      {members.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          No members found
        </div>
      )}
    </div>
  );
}
