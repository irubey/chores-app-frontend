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
import { toast } from "react-hot-toast";
import LeaveHouseholdModal from "@/components/household/LeaveHouseholdModal";

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
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

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
  const adminCount = household.members?.filter(
    (m) => m.role === HouseholdRole.ADMIN && !m.leftAt
  ).length;
  const activeMembers = household.members?.filter((m) => !m.leftAt);
  const isLastAdmin = isAdmin && adminCount === 1;
  const isLastMember = activeMembers?.length === 1;

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

  const handleLeaveHousehold = async () => {
    if (!userMember) return;

    try {
      if (isLastMember) {
        // If last member, delete the household
        await deleteHouseholdMutation.mutateAsync(householdId);
        router.push("/dashboard");
        return;
      }

      if (isLastAdmin) {
        // Show error message if last admin
        toast.error(
          "You must assign another admin before leaving the household"
        );
        return;
      }

      // Leave the household
      await updateMemberMutation.mutateAsync({
        householdId,
        memberId: userMember.id,
        data: { leftAt: new Date() },
      });

      router.push("/dashboard");
    } catch (error) {
      logger.error("Failed to leave household", { error });
      toast.error("Failed to leave household");
    }
  };

  return (
    <div className="container-custom">
      {/* Header Section */}
      <header className="flex justify-between items-center py-8">
        <h1 className="text-h1 mb-0">{household.name}</h1>
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
          {isAdmin ? (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-secondary"
              >
                Edit
              </button>
              {isLastAdmin ? (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </button>
              ) : (
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="btn-outline-secondary"
                >
                  Leave Household
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="btn-outline-secondary"
            >
              Leave Household
            </button>
          )}
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card text-center py-8">
          <h2 className="text-h3 text-red-600 dark:text-red-500">Error</h2>
          <p className="text-text-secondary">{error.message}</p>
        </div>
      )}

      {/* Not Found State */}
      {!household && !isLoading && (
        <div className="card text-center py-8">
          <h2 className="text-h3">Household not found</h2>
          <p className="text-text-secondary">
            The household you're looking for doesn't exist or you don't have
            access.
          </p>
        </div>
      )}

      {/* Main Content */}
      {household && (
        <div className="space-y-8">
          {/* Household Info */}
          <section className="card">
            <h2 className="text-h3 mb-4">Household Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-text-secondary">
                  Currency
                </h3>
                <p className="text-text-primary">{household.currency}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-secondary">
                  Timezone
                </h3>
                <p className="text-text-primary">{household.timezone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-secondary">
                  Language
                </h3>
                <p className="text-text-primary">{household.language}</p>
              </div>
            </div>
          </section>

          {/* Members Section */}
          <section className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h3 mb-0">Members</h2>
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
              members={household.members}
              currentUserId={user?.id}
              onUpdateRole={handleUpdateRole}
              onRemoveMember={handleRemoveMember}
              isAdmin={isAdmin}
            />
          </section>
        </div>
      )}

      {/* Modals */}
      <EditHouseholdModal
        household={household}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateHousehold}
      />
      <DeleteHouseholdModal
        householdName={household?.name || ""}
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
      <LeaveHouseholdModal
        householdName={household?.name || ""}
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveHousehold}
        isLeaving={updateMemberMutation.isPending}
        isLastAdmin={isLastAdmin}
        isLastMember={isLastMember}
      />
    </div>
  );
}
