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
import { ApiError } from "@/lib/api/errors";
import { logger } from "@/lib/api/logger";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import Modal from "@/components/common/Modal";
import Spinner from "@/components/common/Spinner";
import MembersList from "@/components/household/MembersList";
import HouseholdStats from "@/components/household/HouseholdStats";
import InviteMemberModal from "@/components/household/InviteMemberModal";
import { FaUserPlus, FaEdit, FaTrash } from "react-icons/fa";

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
];

export default function HouseholdPage() {
  const { id: householdId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const {
    userHouseholds: households,
    pendingInvitations,
    status,
    getUserHouseholds,
    updateHousehold,
    deleteHousehold,
    addMember,
    removeMember,
    updateMemberRole,
    updateMemberSelection,
    handleInvitationResponse,
    setCurrentHousehold,
  } = useHousehold();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<HouseholdMemberWithUser | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState<UpdateHouseholdDTO>({});

  const household = households.find((h) => h.id === householdId);
  const invitation = pendingInvitations.find(
    (i) => i.householdId === householdId
  );
  const currentUserMember = household?.members?.find(
    (m) => m.userId === user?.id
  );
  const isAdmin = currentUserMember?.role === HouseholdRole.ADMIN;

  useEffect(() => {
    if (!householdId || !user) return;

    // If there's a pending invitation, show it
    if (invitation) {
      logger.debug("Found pending invitation", { invitation });
      return;
    }

    // If there's no household data, fetch it
    if (!household) {
      logger.debug("Fetching household data", { householdId });
      getUserHouseholds().catch((err) => {
        logger.error("Failed to fetch household data", { error: err });
      });
    }
  }, [householdId, user, household, invitation, getUserHouseholds]);

  const handleAcceptInvitation = async () => {
    if (!household || !invitation) return;

    try {
      setIsUpdating(true);
      setError(null);
      logger.debug("Accepting invitation", {
        householdId: household.id,
        memberId: invitation.id,
      });
      await handleInvitationResponse(household.id, invitation.id, true);
      await getUserHouseholds();
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
        memberId: invitation.id,
      });
      await handleInvitationResponse(household.id, invitation.id, false);
      router.replace("/dashboard");
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
    try {
      setIsUpdating(true);
      setError(null);
      await addMember(household.id, data);
      setIsInviteModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to invite member");
      }
      logger.error("Failed to invite member", { error: err });
    } finally {
      setIsUpdating(false);
    }
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
    if (!household) return;

    try {
      setIsUpdating(true);
      setError(null);
      await deleteHousehold(household.id);
      router.replace("/dashboard");
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
    role: HouseholdRole
  ) => {
    if (!household) return;

    try {
      setIsUpdating(true);
      setError(null);
      await updateMemberRole(household.id, memberId, role);
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
    if (!household) return;

    try {
      setIsUpdating(true);
      setError(null);
      logger.debug("Removing member", {
        householdId: household.id,
        memberId,
      });
      await removeMember(household.id, memberId);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to remove member");
      }
      logger.error("Failed to remove member", { error: err });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSelection = async (
    memberId: string,
    isSelected: boolean
  ) => {
    if (!household || !user) return;

    // Optimistically update the UI
    const updatedHousehold = {
      ...household,
      members: household.members?.map((m) =>
        m.userId === user.id ? { ...m, isSelected } : m
      ),
    };
    setCurrentHousehold(updatedHousehold);

    try {
      setIsUpdating(true);
      setError(null);
      logger.debug("useHousehold: Updating member selection", {
        householdId: household.id,
        memberId: user.id,
        isSelected,
      });
      await updateMemberSelection(household.id, user.id, isSelected);
    } catch (err) {
      // Revert optimistic update on error
      setCurrentHousehold(household);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update notification settings");
      }
      logger.error("Failed to update notification settings", { error: err });
    } finally {
      setIsUpdating(false);
    }
  };

  if (status.list === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-h2 mb-4">Household not found</h1>
        <Button variant="primary" onClick={() => router.replace("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // Show invitation response UI if there's a pending invitation
  if (invitation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-h2 mb-4">Household Invitation</h1>
            <p className="text-text-secondary mb-6">
              You have been invited to join {household.name}. Would you like to
              accept this invitation?
            </p>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={handleRejectInvitation}
                disabled={isUpdating}
                className="min-w-[120px]"
              >
                {isUpdating ? (
                  <Spinner size="small" className="mx-auto" />
                ) : (
                  "Reject"
                )}
              </Button>
              <Button
                variant="primary"
                onClick={handleAcceptInvitation}
                disabled={isUpdating}
                className="min-w-[120px]"
              >
                {isUpdating ? (
                  <Spinner size="small" className="mx-auto" />
                ) : (
                  "Accept"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b border-neutral-200 dark:border-neutral-700 pb-4">
        <div>
          <h1 className="text-h2">{household.name}</h1>
          <p className="text-text-secondary">
            {household.members?.length || 0} members
          </p>
          {currentUserMember && (
            <button
              onClick={() =>
                handleUpdateSelection(
                  currentUserMember.id,
                  !currentUserMember.isSelected
                )
              }
              className={`mt-2 text-sm font-medium ${
                currentUserMember.isSelected
                  ? "text-primary"
                  : "text-text-secondary"
              }`}
            >
              {currentUserMember.isSelected ? "Selected" : "Not Selected"}
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(true)}
              icon={<FaEdit className="w-5 h-5 text-primary" />}
              className="btn-icon"
              aria-label="Edit Household"
              title="Edit Household"
            />
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(true)}
              icon={<FaTrash className="w-5 h-5 text-red-500" />}
              className="btn-icon"
              aria-label="Delete Household"
              title="Delete Household"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card bg-primary-light/10 dark:bg-primary-dark/10">
          <h3 className="text-h4 mb-2">Currency</h3>
          <p className="text-text-primary dark:text-text-secondary">
            {household.currency}
          </p>
        </div>
        <div className="card bg-primary-light/10 dark:bg-primary-dark/10">
          <h3 className="text-h4 mb-2">Language</h3>
          <p className="text-text-primary dark:text-text-secondary">
            {household.language}
          </p>
        </div>
        <div className="card bg-primary-light/10 dark:bg-primary-dark/10">
          <h3 className="text-h4 mb-2">Timezone</h3>
          <p className="text-text-primary dark:text-text-secondary">
            {household.timezone}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-h3">Members</h2>
        {isAdmin && (
          <Button
            variant="ghost"
            onClick={() => setIsInviteModalOpen(true)}
            icon={<FaUserPlus className="w-5 h-5 text-primary" />}
            className="btn-icon"
            aria-label="Invite Member"
            title="Invite Member"
          />
        )}
      </div>

      <MembersList
        members={household.members || []}
        currentUserId={user?.id}
        isAdmin={isAdmin}
        onUpdateRole={(member) => {
          setSelectedMember(member);
          setIsRoleModalOpen(true);
        }}
        onRemoveMember={handleRemoveMember}
        className="animate-fade-in"
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Household"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateHousehold();
          }}
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={editData.name || household.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              required
            />

            <Select
              label="Currency"
              value={editData.currency || household.currency}
              onChange={(value) =>
                setEditData({ ...editData, currency: value })
              }
              options={CURRENCY_OPTIONS}
            />

            <Select
              label="Language"
              value={editData.language || household.language}
              onChange={(value) =>
                setEditData({ ...editData, language: value })
              }
              options={LANGUAGE_OPTIONS}
            />

            <Select
              label="Timezone"
              value={editData.timezone || household.timezone}
              onChange={(value) =>
                setEditData({ ...editData, timezone: value })
              }
              options={TIMEZONE_OPTIONS}
            />
          </div>

          {error && <p className="form-error mt-4">{error}</p>}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isUpdating}>
              {isUpdating ? (
                <Spinner size="small" className="mx-auto" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Household"
      >
        <div className="space-y-4">
          <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-red-700 dark:text-red-300">
              Are you sure you want to delete this household? This action cannot
              be undone.
            </p>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteHousehold}
              disabled={isUpdating}
              className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isUpdating ? (
                <Spinner size="small" className="mx-auto" />
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Update Member Role"
      >
        <div className="space-y-4">
          {selectedMember && (
            <>
              <p className="text-text-secondary">
                Update role for {selectedMember.user.name}
              </p>
              <Select
                label="Role"
                value={selectedMember.role}
                onChange={(value) =>
                  handleUpdateMemberRole(
                    selectedMember.id,
                    value as HouseholdRole
                  )
                }
                options={[
                  { value: HouseholdRole.ADMIN, label: "Admin" },
                  { value: HouseholdRole.MEMBER, label: "Member" },
                ]}
              />
            </>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
