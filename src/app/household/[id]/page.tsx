"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useHousehold,
  useUpdateHousehold,
  useDeleteHousehold,
  useUpdateHouseholdMember,
  useSendHouseholdInvitation,
} from "@/hooks/households/useHouseholds";
import { useUser } from "@/hooks/users/useUser";
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
import {
  CurrencyDollarIcon,
  ClockIcon,
  LanguageIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function HouseholdPage() {
  const { id: householdId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: userData } = useUser();
  const user = userData?.data;

  // State for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<HouseholdMemberWithUser | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Queries and mutations
  const {
    data: householdResponse,
    error,
    isLoading,
  } = useHousehold(householdId);
  const household = householdResponse?.data;
  const updateHouseholdMutation = useUpdateHousehold();
  const deleteHouseholdMutation = useDeleteHousehold();
  const updateMemberMutation = useUpdateHouseholdMember(householdId);
  const inviteMemberMutation = useSendHouseholdInvitation(householdId);

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

    try {
      await updateMemberMutation.mutateAsync({
        memberId: selectedMember.id,
        data: { role },
      });
      setSelectedMember(null);
    } catch (error) {
      logger.error("Failed to update member role", { error });
      toast.error("Failed to update member role");
    }
  };

  const handleUpdateNickname = async (
    member: HouseholdMemberWithUser,
    nickname: string
  ) => {
    try {
      await updateMemberMutation.mutateAsync({
        memberId: member.id,
        data: { nickname },
      });
    } catch (error) {
      logger.error("Failed to update member nickname", { error });
      toast.error("Failed to update member nickname");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await updateMemberMutation.mutateAsync({
        memberId,
        data: { leftAt: new Date() },
      });
    } catch (error) {
      logger.error("Failed to remove member", { error });
      toast.error("Failed to remove member");
    }
  };

  const handleInviteMember = async (data: AddMemberDTO) => {
    try {
      await inviteMemberMutation.mutateAsync({
        email: data.email,
      });
      setIsInviteModalOpen(false);
      toast.success("Invitation sent successfully");
    } catch (error) {
      logger.error("Failed to invite member", { error });
      toast.error("Failed to invite member");
    }
  };

  const handleUpdateHousehold = async (data: UpdateHouseholdDTO) => {
    try {
      await updateHouseholdMutation.mutateAsync({
        householdId,
        data,
      });
      setIsEditModalOpen(false);
      toast.success("Household updated successfully");
    } catch (error) {
      logger.error("Failed to update household", { error });
      toast.error("Failed to update household");
    }
  };

  const handleDeleteHousehold = async () => {
    try {
      await deleteHouseholdMutation.mutateAsync(householdId);
      router.push("/dashboard");
      toast.success("Household deleted successfully");
    } catch (error) {
      logger.error("Failed to delete household", { error });
      toast.error("Failed to delete household");
    }
  };

  const handleLeaveHousehold = async () => {
    if (!userMember) return;

    try {
      if (isLastMember) {
        // If last member, delete the household
        await deleteHouseholdMutation.mutateAsync(householdId);
        router.push("/dashboard");
        toast.success("Household deleted successfully");
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
        memberId: userMember.id,
        data: { leftAt: new Date() },
      });

      router.push("/dashboard");
      toast.success("Left household successfully");
    } catch (error) {
      logger.error("Failed to leave household", { error });
      toast.error("Failed to leave household");
    }
  };

  return (
    <div className="container-custom">
      {/* Header Section with Household Info */}
      <div className="card my-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-h2 mb-2">{household.name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <CurrencyDollarIcon className="w-4 h-4" />
                {household.currency}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                {household.timezone}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <LanguageIcon className="w-4 h-4" />
                {household.language}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="btn-icon"
                  title="Edit Household"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="btn-icon"
                  title="Delete Household"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="btn-icon"
                title="Leave Household"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="card my-8">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-h3">Members</h2>
            {isAdmin && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="btn btn-primary"
              >
                Invite Member
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <MembersList
              members={household.members ?? []}
              currentUserId={user?.id ?? ""}
              onUpdateRole={handleUpdateRole}
              onRemoveMember={handleRemoveMember}
              onUpdateNickname={handleUpdateNickname}
              isAdmin={isAdmin}
            />
          </div>
        </div>
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
        />
      )}
      <LeaveHouseholdModal
        householdName={household.name}
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveHousehold}
      />
    </div>
  );
}
