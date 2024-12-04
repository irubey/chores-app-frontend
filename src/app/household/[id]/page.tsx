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
    updateMemberSelection,
    handleInvitationResponse,
    isLoading,
    error: householdError,
    getUserHouseholds,
    setCurrentHousehold,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" className="text-primary" />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-h1 mb-6">Household not found</h1>
        <Button
          variant="primary"
          onClick={() => router.push("/dashboard")}
          className="animate-slide-up"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 animate-fade-in">
      <Card className="mb-8">
        <div className="flex justify-between items-center mb-6 border-b border-neutral-200 dark:border-neutral-700 pb-4">
          <div>
            <h1 className="text-h2 mb-1">{household.name}</h1>
            <div className="flex items-center gap-4">
              <p className="text-text-secondary text-sm">
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
                  className={`text-sm flex items-center gap-2 ${
                    currentUserMember.isSelected
                      ? "text-text-secondary hover:text-text-primary"
                      : "text-red-500 hover:text-red-600"
                  } transition-colors duration-200`}
                  disabled={isUpdating}
                >
                  {currentUserMember.isSelected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      Receiving Updates
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Muted
                    </>
                  )}
                </button>
              )}
            </div>
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
              {household.currency || "USD"}
            </p>
          </div>
          <div className="card bg-primary-light/10 dark:bg-primary-dark/10">
            <h3 className="text-h4 mb-2">Language</h3>
            <p className="text-text-primary dark:text-text-secondary">
              {household.language || "en"}
            </p>
          </div>
          <div className="card bg-primary-light/10 dark:bg-primary-dark/10">
            <h3 className="text-h4 mb-2">Created</h3>
            <p className="text-text-primary dark:text-text-secondary">
              {new Date(household.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {isPending ? (
          <div className="flex flex-col items-center justify-center p-8 bg-accent-light/10 dark:bg-accent-dark/10 rounded-lg">
            <h2 className="text-h3 mb-4">Pending Invitation</h2>
            <div className="flex gap-4">
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
            </div>
          </div>
        ) : (
          <div>
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
              onChangeRole={(member) => {
                setSelectedMember(member);
                setIsRoleModalOpen(true);
              }}
              onRemoveMember={handleRemoveMember}
              className="animate-fade-in"
            />
          </div>
        )}
      </Card>

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
              className="input"
            />
            <Select
              label="Currency"
              value={editData.currency || household.currency || "USD"}
              onChange={(value) =>
                setEditData({ ...editData, currency: value })
              }
              options={[
                { value: "USD", label: "USD" },
                { value: "EUR", label: "EUR" },
                { value: "GBP", label: "GBP" },
              ]}
              className="input"
            />
            <Select
              label="Language"
              value={editData.language || household.language || "en"}
              onChange={(value) =>
                setEditData({ ...editData, language: value })
              }
              options={[
                { value: "en", label: "English" },
                { value: "es", label: "Spanish" },
                { value: "fr", label: "French" },
              ]}
              className="input"
            />
            {error && <p className="form-error">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
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
              <div className="bg-primary-light/10 dark:bg-primary-dark/10 p-4 rounded-lg">
                <p className="text-text-primary dark:text-text-secondary">
                  Update role for{" "}
                  <span className="font-medium">
                    {selectedMember.user?.name}
                  </span>
                  <span className="text-text-secondary">
                    {" "}
                    ({selectedMember.user?.email})
                  </span>
                </p>
              </div>
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
                className="input"
              />
            </>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsRoleModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
