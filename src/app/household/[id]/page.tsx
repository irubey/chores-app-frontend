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
import { ApiError } from "@/lib/api/errors";
import {
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaCrown,
  FaUserCog,
} from "react-icons/fa";
import Spinner from "@/components/common/Spinner";

export default function HouseholdPage(): React.ReactElement {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const {
    userHouseholds,
    updateHousehold,
    addMember,
    removeMember,
    deleteHousehold,
    updateMemberRole,
    isLoading,
    error: householdError,
  } = useHousehold();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<HouseholdMemberWithUser | null>(null);
  const [inviteData, setInviteData] = useState<AddMemberDTO>({
    email: "",
    role: HouseholdRole.MEMBER,
  });
  const [editData, setEditData] = useState<UpdateHouseholdDTO>({});
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const household = userHouseholds.find((h) => h.id === id);
  const currentUserMember = household?.members?.find(
    (m) => m.userId === user?.id
  );
  const isAdmin = currentUserMember?.role === HouseholdRole.ADMIN;

  const handleInviteMember = async () => {
    if (!household) return;

    try {
      setIsUpdating(true);
      setError(null);
      await addMember(household.id, inviteData);
      setIsInviteModalOpen(false);
      setInviteData({ email: "", role: HouseholdRole.MEMBER });
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
            >
              <FaUserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {household.members
            ?.filter(
              (m): m is HouseholdMemberWithUser => "user" in m && m.isAccepted
            )
            .sort((a, b) => {
              if (a.userId === user?.id) return -1;
              if (b.userId === user?.id) return 1;
              if (
                a.role === HouseholdRole.ADMIN &&
                b.role !== HouseholdRole.ADMIN
              )
                return -1;
              if (
                b.role === HouseholdRole.ADMIN &&
                a.role !== HouseholdRole.ADMIN
              )
                return 1;
              return (a.user?.name || "").localeCompare(b.user?.name || "");
            })
            .map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary-dark dark:bg-secondary-light" />
                  <div>
                    <p className="font-medium">
                      {member.user?.name}
                      {member.userId === user?.id && " (You)"}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {member.role === HouseholdRole.ADMIN ? "Admin" : "Member"}
                    </p>
                  </div>
                </div>
                {isAdmin && member.userId !== user?.id && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="text-primary dark:text-primary-light"
                      onClick={() => {
                        setSelectedMember(member);
                        setIsRoleModalOpen(true);
                      }}
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
                      onClick={() => handleRemoveMember(member.id)}
                      aria-label={`Remove ${member.user?.name || "member"}`}
                    >
                      <FaTrash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
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
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteData({ email: "", role: HouseholdRole.MEMBER });
          setError(null);
        }}
        title="Invite Member"
      >
        <div className="space-y-4">
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
              variant="ghost"
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteData({ email: "", role: HouseholdRole.MEMBER });
                setError(null);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleInviteMember}
              disabled={isUpdating || !inviteData.email}
            >
              {isUpdating ? "Inviting..." : "Invite"}
            </Button>
          </div>
        </div>
      </Modal>

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
