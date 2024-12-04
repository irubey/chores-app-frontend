import React, { useState } from "react";
import { HouseholdRole } from "@shared/enums";
import { AddMemberDTO } from "@shared/types";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";
import { logger } from "@/lib/api/logger";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { UserPlusIcon } from "@heroicons/react/24/outline";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: AddMemberDTO) => Promise<void>;
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
}: InviteMemberModalProps): React.ReactElement {
  const [inviteData, setInviteData] = useState<AddMemberDTO>({
    email: "",
    role: HouseholdRole.MEMBER,
  });
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleInvite = async () => {
    if (isUpdating || !inviteData.email) return;

    try {
      setIsUpdating(true);
      setError(null);

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteData.email)) {
        setError("Please enter a valid email address");
        return;
      }

      await onInvite(inviteData);
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.type) {
          case ApiErrorType.NOT_FOUND:
            setError(
              "This email is not registered. Please ask them to create an account first, then try inviting them again."
            );
            break;
          case ApiErrorType.VALIDATION:
            setError("Please enter a valid email address");
            break;
          case ApiErrorType.CONFLICT:
            setError("This user is already a member of the household");
            break;
          default:
            setError(err.message);
        }
      } else {
        setError("Failed to invite member");
      }
      logger.error("Failed to invite member", { error: err });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setInviteData({ email: "", role: HouseholdRole.MEMBER });
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleInvite();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded-md">
            {error}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          value={inviteData.email}
          onChange={(e) =>
            setInviteData({ ...inviteData, email: e.target.value })
          }
          placeholder="member@example.com"
        />
        <Select
          label="Role"
          value={inviteData.role}
          onChange={(value) =>
            setInviteData({ ...inviteData, role: value as HouseholdRole })
          }
          options={[
            { value: HouseholdRole.MEMBER, label: "Member" },
            { value: HouseholdRole.ADMIN, label: "Admin" },
          ]}
        />
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isUpdating || !inviteData.email}
          >
            {isUpdating ? "Inviting..." : "Invite Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
