import React from "react";
import { HouseholdMemberWithUser } from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { logger } from "@/lib/api/logger";

interface UpdateMemberRoleModalProps {
  member: HouseholdMemberWithUser;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (role: HouseholdRole) => Promise<void>;
  isUpdating: boolean;
}

export default function UpdateMemberRoleModal({
  member,
  isOpen,
  onClose,
  onConfirm,
  isUpdating,
}: UpdateMemberRoleModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async (role: HouseholdRole) => {
    try {
      await onConfirm(role);
      logger.info("Member role update confirmed", {
        memberId: member.id,
        newRole: role,
      });
      onClose();
    } catch (error) {
      logger.error("Failed to update member role", { error });
    }
  };

  const newRole =
    member.role === HouseholdRole.ADMIN
      ? HouseholdRole.MEMBER
      : HouseholdRole.ADMIN;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md animate-scale">
        <h2 className="text-h3 mb-4">Update Member Role</h2>

        <p className="text-text-primary dark:text-text-secondary mb-6">
          Are you sure you want to change <strong>{member.user?.name}</strong>
          &apos;s role from <strong>{member.role}</strong> to{" "}
          <strong>{newRole}</strong>?
        </p>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleConfirm(newRole)}
            className="btn-primary"
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
