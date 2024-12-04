"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHousehold } from "@/hooks/useHousehold";
import { useAuth } from "@/hooks/useAuth";
import { HouseholdRole } from "@shared/enums";
import {
  AddMemberDTO,
  HouseholdMemberWithUser,
  UpdateHouseholdDTO,
} from "@shared/types";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import { Select } from "@/components/common/Select";
import { logger } from "@/lib/api/logger";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";
import MembersList from "@/components/household/MembersList";
import {
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaCrown,
  FaUserCog,
} from "react-icons/fa";
import Spinner from "@/components/common/Spinner";
import InviteMemberModal from "@/components/household/InviteMemberModal";

export default function HouseholdPage(): React.ReactElement {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const invitationId = searchParams.get("invitation");
  const { user } = useAuth();
  const {
    userHouseholds,
    pendingInvitations,
    updateHousehold,
    addMember,
    removeMember,
    deleteHousehold,
    updateMemberRole,
    handleInvitationResponse,
    isLoading,
    error: householdError,
    getUserHouseholds,
  } = useHousehold();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<HouseholdMemberWithUser | null>(null);
  const [editData, setEditData] = useState<UpdateHouseholdDTO>({});
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const household =
    userHouseholds.find((h) => h.id === id) ||
    pendingInvitations.find((inv) => inv.household?.id === id)?.household;
  const invitation = invitationId
    ? pendingInvitations.find((inv) => inv.id === invitationId)
    : pendingInvitations.find((inv) => inv.household?.id === id);
  const isPending = !!invitation;

  logger.debug("Household page state", {
    householdId: id,
    hasHousehold: !!household,
    hasInvitation: !!invitation,
    isPending,
    invitationId,
    pendingInvitationsCount: pendingInvitations.length,
  });

  const currentUserMember = household?.members?.find(
    (m) => m.userId === user?.id
  );
  const isAdmin = currentUserMember?.role === HouseholdRole.ADMIN;

  const handleAcceptInvitation = async () => {
    if (!household || !invitation) return;

    try {
      setIsUpdating(true);
      setError(null);
      logger.debug("Accepting invitation", {
        householdId: household.id,
        userId: invitation.userId,
      });
      await handleInvitationResponse(household.id, invitation.userId, true);
      await getUserHouseholds();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to accept invitation");
      }
      logger.error("Failed to accept invitation", { error: err });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectInvitation = async () => {
    if (!household || !invitation) return;

    try {
      setIsUpdating(true);
      setError(null);
      logger.debug("Rejecting invitation", {
        householdId: household.id,
        userId: invitation.userId,
      });
      await handleInvitationResponse(household.id, invitation.userId, false);
      await getUserHouseholds();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to reject invitation");
      }
      logger.error("Failed to reject invitation", { error: err });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInviteMember = async (data: AddMemberDTO) => {
    if (!household) return;
    await addMember(household.id, data);
  };

  const handleUpdateHousehold = async () => {
    if (!household) return;

    try {
      setIsUpdating(true);
      setError(null);
      await updateHousehold(household.id, editData);
      setIsEditModalOpen(false);
      setEditData({});
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update household");
      }
      logger.error("Failed to update household", { error: err });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteHousehold = async () => {
    if (
      !household ||
      !window.confirm("Are you sure? This action cannot be undone.")
    )
      return;

    try {
      setIsUpdating(true);
      setError(null);
      await deleteHousehold(household.id);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to delete household");
      }
      logger.error("Failed to delete household", { error: err });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: HouseholdRole
  ) => {
    if (!household) return;

    try {
      setIsUpdating(true);
      setError(null);
      await updateMemberRole(household.id, memberId, newRole);
      setIsRoleModalOpen(false);
      setSelectedMember(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update member role");
      }
      logger.error("Failed to update member role", { error: err });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (
      !household ||
      !window.confirm("Are you sure you want to remove this member?")
    )
      return;

    try {
      setError(null);
      await removeMember(household.id, memberId);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to remove member");
      }
      logger.error("Failed to remove member", { error: err });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="text-center py-8">
        <h2 className="text-h2 text-text-secondary">Household not found</h2>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <div className="text-center space-y-4">
            <h1 className="text-h1">Invitation to {household.name}</h1>
            <p className="text-text-secondary">
              You have been invited to join this household. Would you like to
              accept or reject the invitation?
            </p>
            {error && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded-md">
                {error}
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button
                variant="ghost"
                onClick={handleRejectInvitation}
                disabled={isUpdating}
              >
                {isUpdating ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                variant="primary"
                onClick={handleAcceptInvitation}
                disabled={isUpdating}
              >
                {isUpdating ? "Accepting..." : "Accept"}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-h2 mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary">
                Currency
              </label>
              <p className="text-text-primary">{household.currency}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">
                Timezone
              </label>
              <p className="text-text-primary">{household.timezone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">
                Language
              </label>
              <p className="text-text-primary">{household.language}</p>
            </div>
            {household.icon && (
              <div>
                <label className="text-sm font-medium text-text-secondary">
                  Icon
                </label>
                <p className="text-text-primary">{household.icon}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-h2 mb-4">Members</h2>
          <MembersList
            members={household.members}
            currentUserId={user?.id}
            maxDisplay={10}
            isAdmin={false}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Household Name Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-h1">{household.name}</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-primary dark:text-primary-light"
              onClick={() => {
                setEditData({
                  name: household.name,
                  currency: household.currency,
                  timezone: household.timezone,
                  language: household.language,
                });
                setIsEditModalOpen(true);
              }}
            >
              <FaEdit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="ghost"
              className="btn-icon text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => setIsDeleteModalOpen(true)}
              aria-label="Delete household"
            >
              <FaTrash className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Members Section */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-h2">Members</h2>
          {isAdmin && (
            <Button
              variant="primary"
              onClick={() => setIsInviteModalOpen(true)}
              className="p-2"
              title="Invite Member"
            >
              <FaUserPlus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-3">
          <MembersList
            members={household.members}
            currentUserId={user?.id}
            maxDisplay={10}
            isAdmin={isAdmin}
            onChangeRole={(member) => {
              setSelectedMember(member);
              setIsRoleModalOpen(true);
            }}
            onRemoveMember={handleRemoveMember}
          />
        </div>
      </Card>

      {/* Household Details Section */}
      <Card>
        <h2 className="text-h2 mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Currency
            </label>
            <p className="text-text-primary">{household.currency}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Timezone
            </label>
            <p className="text-text-primary">{household.timezone}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Language
            </label>
            <p className="text-text-primary">{household.language}</p>
          </div>
          {household.icon && (
            <div>
              <label className="text-sm font-medium text-text-secondary">
                Icon
              </label>
              <p className="text-text-primary">{household.icon}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditData({});
          setError(null);
        }}
        title="Edit Household"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editData.name || ""}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            placeholder="Household name"
          />
          <Select
            label="Currency"
            value={editData.currency || household.currency}
            onChange={(value) => setEditData({ ...editData, currency: value })}
            options={[
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
              { value: "GBP", label: "GBP" },
            ]}
          />
          <Select
            label="Timezone"
            value={editData.timezone || household.timezone}
            onChange={(value) => setEditData({ ...editData, timezone: value })}
            options={[
              { value: "UTC", label: "UTC" },
              { value: "America/New_York", label: "Eastern Time" },
              { value: "America/Chicago", label: "Central Time" },
              { value: "America/Denver", label: "Mountain Time" },
              { value: "America/Los_Angeles", label: "Pacific Time" },
            ]}
          />
          <Select
            label="Language"
            value={editData.language || household.language}
            onChange={(value) => setEditData({ ...editData, language: value })}
            options={[
              { value: "en", label: "English" },
              { value: "es", label: "Spanish" },
              { value: "fr", label: "French" },
            ]}
          />
          <div className="flex justify-end gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditData({});
                setError(null);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateHousehold}
              disabled={isUpdating || !editData.name}
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setSelectedMember(null);
          setError(null);
        }}
        title="Change Member Role"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Change role for {selectedMember?.user?.name}
          </p>
          <Select
            label="Role"
            value={selectedMember?.role || HouseholdRole.MEMBER}
            onChange={(value) =>
              selectedMember &&
              handleUpdateMemberRole(selectedMember.id, value as HouseholdRole)
            }
            options={[
              { value: HouseholdRole.MEMBER, label: "Member" },
              { value: HouseholdRole.ADMIN, label: "Admin" },
            ]}
          />
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setError(null);
        }}
        title="Delete Household"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this household? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-4">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-700"
              onClick={handleDeleteHousehold}
              disabled={isUpdating}
            >
              {isUpdating ? "Deleting..." : "Delete Household"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
