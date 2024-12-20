"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/users/useUser";
import { useHouseholds } from "@/hooks/households/useHouseholds";
import { useRouter } from "next/navigation";
import { useChores } from "@/hooks/chores/useChores";
import { useChoreSwap } from "@/hooks/chores/useChoreSwap";
import { ChoreCard } from "@/components/chores/ChoreCard";
import { CreateChoreModal } from "@/components/chores/CreateChoreModal";
import { ChoreStatus } from "@shared/enums";
import { ChoreWithAssignees, HouseholdMember, User } from "@shared/types";

export default function ChoresPage() {
  const router = useRouter();
  const { data: userData, isLoading: isUserLoading } = useUser();
  const { data: householdsData, isLoading: isHouseholdsLoading } =
    useHouseholds();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const activeHouseholdId = userData?.data?.activeHouseholdId;
  const activeHousehold = householdsData?.data.find(
    (h) => h.id === activeHouseholdId
  );

  const {
    chores,
    isLoading: isChoresLoading,
    updateChore,
  } = useChores(activeHouseholdId || "");

  // Track the active chore for swap requests
  const [activeChoreId, setActiveChoreId] = useState<string | null>(null);

  // Only create the swap hook when we have an active chore
  const { requestSwap } = useChoreSwap(
    activeHouseholdId || "",
    activeChoreId || ""
  );

  useEffect(() => {
    if (!isUserLoading && !userData?.data) {
      router.push("/login");
    }
  }, [isUserLoading, userData, router]);

  if (isUserLoading || isHouseholdsLoading || isChoresLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse-subtle">Loading...</div>
      </div>
    );
  }

  if (!activeHouseholdId || !activeHousehold) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-h2">No Active Household</h1>
        <p className="text-text-secondary">
          Please select or create a household to view chores.
        </p>
        <button
          onClick={() => router.push("/households")}
          className="btn-primary"
        >
          Go to Households
        </button>
      </div>
    );
  }

  const handleChoreComplete = (choreId: string) => {
    const chore = chores.find((c) => c.id === choreId);
    if (!chore) return;

    updateChore({
      choreId,
      data: {
        title: chore.title,
        status: ChoreStatus.COMPLETED,
      },
    });
  };

  const handleSubtaskComplete = (choreId: string, subtaskId: string) => {
    // The SubtaskList component now handles this internally
    console.log("Subtask completed:", { choreId, subtaskId });
  };

  const handleChoreEdit = (chore: ChoreWithAssignees) => {
    // TODO: Implement edit modal
    console.log("Edit chore:", chore);
  };

  const handleSwapRequest = (choreId: string) => {
    setActiveChoreId(choreId);
    // TODO: Implement swap request modal to select target user
    console.log("Request swap for chore:", choreId);
  };

  // Filter chores for the next 7 days or show pending chores without due dates
  const upcomingChores = chores.filter((chore) => {
    // Include pending chores without due dates
    if (!chore.dueDate) return chore.status === ChoreStatus.PENDING;

    // Filter chores with due dates within the next 7 days
    const dueDate = new Date(chore.dueDate);
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    return dueDate >= now && dueDate <= sevenDaysFromNow;
  });

  // Filter out members without user data
  const validMembers = (activeHousehold.members || []).filter(
    (member): member is HouseholdMember & { user: User } => !!member.user
  );

  return (
    <main className="container-custom py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-h2">{activeHousehold.name} Chores</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          Add Chore
        </button>
      </div>
      <div className="grid grid-auto-fit gap-6">
        {upcomingChores.map((chore) => (
          <ChoreCard
            key={chore.id}
            chore={chore}
            householdId={activeHouseholdId}
            onComplete={handleChoreComplete}
            onSubtaskComplete={handleSubtaskComplete}
            onEdit={handleChoreEdit}
            onSwapRequest={handleSwapRequest}
          />
        ))}
        {upcomingChores.length === 0 && (
          <div className="col-span-full text-center py-8 text-text-secondary">
            No upcoming chores for the next 7 days
          </div>
        )}
      </div>

      <CreateChoreModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        householdId={activeHouseholdId}
        members={validMembers}
      />
    </main>
  );
}
