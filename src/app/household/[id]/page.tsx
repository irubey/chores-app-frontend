"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useHousehold,
  useUpdateHousehold,
  useDeleteHousehold,
  useUpdateHouseholdMember,
  useSendHouseholdInvitation,
  useUpdateHouseholdMemberSelection,
} from "@/hooks/households/useHouseholds";
import { useAuthUser } from "@/contexts/UserContext";
import { HouseholdRole } from "@shared/enums";
import {
  HouseholdMemberWithUser,
  AddMemberDTO,
  UpdateHouseholdDTO,
} from "@shared/types";
import MembersList from "@/components/household/MembersList";
import EditHouseholdModal from "@/components/household/EditHouseholdModal";
import DeleteHouseholdModal from "@/components/household/DeleteHouseholdModal";
import InviteMemberModal from "@/components/household/InviteMemberModal";
import UpdateMemberRoleModal from "@/components/household/UpdateMemberRoleModal";
import Spinner from "@/components/common/Spinner";
import { logger } from "@/lib/api/logger";

export default function HouseholdPage() {
  const { id: householdId } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthUser();

  // State for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<HouseholdMemberWithUser | null>(null);

  // Queries and mutations
  const { data: household, error, isLoading } = useHousehold(householdId);
  const updateHouseholdMutation = useUpdateHousehold();
  const deleteHouseholdMutation = useDeleteHousehold();
  const updateMemberMutation = useUpdateHouseholdMember();
  const inviteMemberMutation = useSendHouseholdInvitation();
  const updateSelectionMutation = useUpdateHouseholdMemberSelection();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="large" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Error loading household
          </h2>
          <p className="text-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!household) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Household not found</h2>
          <p className="text-text-secondary">
            The household you're looking for doesn't exist or you don't have
            access.
          </p>
        </div>
      </div>
    );
  }

  // Check user permissions and selection status
  const userMember = household.members?.find((m) => m.userId === user?.id);
  const isAdmin = userMember?.role === HouseholdRole.ADMIN;
  const isSelected = userMember?.isSelected ?? false;

  // Handle member updates
  const handleUpdateRole = (member: HouseholdMemberWithUser) => {
    setSelectedMember(member);
  };

  const handleConfirmRoleUpdate = async (role: HouseholdRole) => {
    if (!selectedMember) return;

    await updateMemberMutation.mutateAsync({
      householdId,
      memberId: selectedMember.id,
      data: { role },
    });
  };

  const handleRemoveMember = (memberId: string) => {
    updateMemberMutation.mutate({
      householdId,
      memberId,
      data: { leftAt: new Date() },
    });
  };

  const handleInviteMember = async (data: AddMemberDTO) => {
    try {
      await inviteMemberMutation.mutateAsync({
        householdId,
        email: data.email,
      });
      setIsInviteModalOpen(false);
    } catch (error) {
      logger.error("Failed to invite member", { error });
    }
  };

  const handleUpdateHousehold = async (data: UpdateHouseholdDTO) => {
    try {
      await updateHouseholdMutation.mutateAsync({
        id: householdId,
        data,
      });
      setIsEditModalOpen(false);
    } catch (error) {
      logger.error("Failed to update household", { error });
    }
  };

  const handleDeleteHousehold = async () => {
    try {
      await deleteHouseholdMutation.mutateAsync(householdId);
      router.push("/dashboard");
    } catch (error) {
      logger.error("Failed to delete household", { error });
    }
  };

  const handleSelectionToggle = async () => {
    if (!household || !userMember) return;

    try {
      await updateSelectionMutation.mutateAsync({
        householdId: household.id,
        isSelected: !userMember.isSelected,
      });
    } catch (error) {
      logger.error("Failed to toggle household selection", { error });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-h2">{household.name}</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectionToggle}
            className={`btn ${
              isSelected ? "btn-primary" : "btn-outline-primary"
            }`}
            disabled={updateSelectionMutation.isPending}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-secondary"
              >
                Edit
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="btn-accent"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Cards Section */}
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

      {/* Members Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-h3">Members</h2>
          {isAdmin && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="btn-primary"
            >
              Invite Member
            </button>
          )}
        </div>

        <MembersList
          members={household.members || []}
          currentUserId={user?.id || ""}
          isAdmin={isAdmin}
          onUpdateRole={handleUpdateRole}
          onRemoveMember={handleRemoveMember}
        />
      </div>

      {/* Modals */}
      <EditHouseholdModal
        household={household}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateHousehold}
      />

      <DeleteHouseholdModal
        householdName={household.name}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteHousehold}
        isDeleting={deleteHouseholdMutation.isPending}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
      />

      {selectedMember && (
        <UpdateMemberRoleModal
          member={selectedMember}
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          onConfirm={handleConfirmRoleUpdate}
          isUpdating={updateMemberMutation.isPending}
        />
      )}
    </div>
  );
}
