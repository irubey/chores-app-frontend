import React from "react";
import { HouseholdMemberWithUser } from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { useUpdateHouseholdMember } from "@/hooks/households/useHouseholds";
import { logger } from "@/lib/api/logger";
import Avatar from "@/components/common/Avatar";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import {
  FaUserShield,
  FaUserCog,
  FaUserMinus,
  FaPencilAlt,
} from "react-icons/fa";

interface MembersListProps {
  members: HouseholdMemberWithUser[];
  currentUserId: string;
  isAdmin: boolean;
  onUpdateRole?: (member: HouseholdMemberWithUser) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateNickname?: (
    member: HouseholdMemberWithUser,
    nickname: string
  ) => void;
  className?: string;
}

function getDisplayName(
  member: HouseholdMemberWithUser,
  allMembers: HouseholdMemberWithUser[]
): string {
  // If nickname exists, use it
  if (member.nickname) {
    return member.nickname;
  }

  if (!member.user?.name) {
    return "Unknown Member";
  }

  // Split full name
  const [firstName, ...rest] = member.user.name.split(" ");
  const lastName = rest.join(" ");

  // Count members with the same first name
  const membersWithSameFirstName = allMembers.filter(
    (m) => m.user?.name?.split(" ")[0] === firstName
  );

  // If there are multiple members with the same first name, use full name
  if (membersWithSameFirstName.length > 1) {
    return member.user.name;
  }

  // Otherwise just use first name
  return firstName;
}

export default function MembersList({
  members,
  currentUserId,
  isAdmin,
  onUpdateRole,
  onRemoveMember,
  onUpdateNickname,
  className = "",
}: MembersListProps) {
  const [editingNickname, setEditingNickname] = React.useState<string | null>(
    null
  );
  const [nicknameValue, setNicknameValue] = React.useState("");

  // Sort members: Admins first, then active members, then by name
  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => {
      // First sort by active status
      if (!a.leftAt && b.leftAt) return -1;
      if (a.leftAt && !b.leftAt) return 1;

      // Then by role
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
        `Remove ${getDisplayName(member, members)} from the household?`
      )
    ) {
      onRemoveMember(member.id);
    }
  };

  const handleStartEditNickname = (member: HouseholdMemberWithUser) => {
    setEditingNickname(member.id);
    setNicknameValue(member.nickname ?? "");
  };

  const handleSaveNickname = (member: HouseholdMemberWithUser) => {
    if (onUpdateNickname) {
      onUpdateNickname(member, nicknameValue);
    }
    setEditingNickname(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedMembers.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const canManage = isAdmin && !isCurrentUser;
        const isEditing = editingNickname === member.id;
        const displayName = getDisplayName(member, members);

        return (
          <div
            key={member.id}
            className={`flex items-end p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${
              member.leftAt ? "opacity-50" : ""
            }`}
          >
            <div className="flex-shrink-0 mr-4">
              <Avatar
                src={member.user?.profileImageURL}
                alt={displayName}
                size="md"
              />
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-end justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="flex flex-col">
                    <h3 className="font-medium truncate leading-none">
                      {displayName}
                      {isCurrentUser && (
                        <span className="text-text-secondary ml-2">(You)</span>
                      )}
                    </h3>
                    {isEditing ? (
                      <div className="flex items-center mt-1">
                        <input
                          type="text"
                          value={nicknameValue}
                          onChange={(e) => setNicknameValue(e.target.value)}
                          className="text-sm px-2 py-1 border rounded"
                          placeholder="Enter nickname"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveNickname(member)}
                          className="ml-2"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNickname(null)}
                          className="ml-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      member.user?.name !== displayName && (
                        <span className="text-sm text-text-secondary">
                          {member.user?.name}
                        </span>
                      )
                    )}
                  </div>
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
                    className="text-xs py-0 h-5 inline-flex items-center flex-shrink-0"
                  >
                    {member.role}
                  </Badge>
                </div>
                {canManage && !member.leftAt && (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEditNickname(member)}
                      icon={<FaPencilAlt />}
                      aria-label="Edit nickname"
                      title="Edit nickname"
                    />
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
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <span className="truncate">
                  {member.user?.email ?? "No email"}
                </span>
                {member.isInvited && !member.isAccepted && (
                  <Badge
                    variant="warning"
                    className="text-xs py-0 h-5 inline-flex items-center flex-shrink-0"
                  >
                    Pending
                  </Badge>
                )}
                {member.leftAt && (
                  <Badge
                    variant="error"
                    className="text-xs py-0 h-5 inline-flex items-center flex-shrink-0"
                  >
                    Left
                  </Badge>
                )}
              </div>
            </div>
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
