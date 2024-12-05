"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useThreads } from "@/hooks/threads/useThreads";
import { ThreadList } from "@/components/threads/ThreadList";
import { ThreadListSkeleton } from "@/components/threads/skeletons/ThreadCardSkeleton";
import { useHouseholds } from "@/contexts/HouseholdsContext";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { logger } from "@/lib/api/logger";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Card from "@/components/common/Card";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="text-text-secondary">{icon}</div>
        <h2 className="text-h4">{title}</h2>
        <p className="text-text-secondary">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </Card>
  );
}

export default function ThreadsPage() {
  const { user, status: authStatus, isAuthenticated } = useAuth();
  const { selectedHouseholds, isLoading: isLoadingHouseholds } =
    useHouseholds();

  logger.debug("User and household data", {
    user: {
      id: user?.id,
      email: user?.email,
    },
    selectedHouseholds: selectedHouseholds?.map((h) => ({
      id: h.id,
      name: h.name,
      members: h.members?.map((m) => ({
        userId: m.userId,
        role: m.role,
        isAccepted: m.isAccepted,
        isSelected: m.isSelected,
      })),
    })),
  });

  const accessibleHouseholds = useMemo(() => {
    if (!selectedHouseholds?.length || !user?.id) {
      logger.debug("No households to check or no user", {
        hasHouseholds: !!selectedHouseholds?.length,
        userId: user?.id,
      });
      return [];
    }

    return selectedHouseholds.filter((h) => {
      // If no members array, household is not properly loaded
      if (!h.members?.length) {
        logger.debug("Household missing members data", {
          householdId: h.id,
          householdName: h.name,
        });
        return false;
      }

      const isMember = h.members.some(
        (m) => m.userId === user.id && m.isAccepted && !m.leftAt && m.isSelected
      );

      logger.debug("Checking household accessibility", {
        householdId: h.id,
        householdName: h.name,
        userId: user.id,
        isMember,
        members: h.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          isAccepted: m.isAccepted,
          isSelected: m.isSelected,
          leftAt: m.leftAt,
        })),
      });

      return isMember;
    });
  }, [selectedHouseholds, user?.id]);

  const filters = useMemo(
    () => ({
      householdIds: accessibleHouseholds.map((h) => h.id),
    }),
    [accessibleHouseholds]
  );

  const {
    threads,
    isLoading: isLoadingThreads,
    error,
  } = useThreads({
    initialPageSize: 20,
    autoRefreshInterval: 30000,
    filters,
    enabled: isAuthenticated && !!user && accessibleHouseholds.length > 0,
  });

  logger.debug("Rendering threads page", {
    threadsCount: threads?.length,
    selectedHouseholds: {
      total: selectedHouseholds?.length,
      accessible: accessibleHouseholds.length,
      ids: selectedHouseholds?.map((h) => h.id),
      accessibleIds: filters.householdIds,
    },
    isLoadingThreads,
    isLoadingHouseholds,
    authStatus,
    isAuthenticated,
    hasUser: !!user,
  });

  const isLoading =
    isLoadingHouseholds || isLoadingThreads || authStatus === "loading";

  if (authStatus === "loading") {
    return (
      <div className="container-custom py-md">
        <ThreadListSkeleton />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container-custom py-md">
        <EmptyState
          icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
          title="Please sign in"
          description="You need to be signed in to view threads"
        />
      </div>
    );
  }

  if (!selectedHouseholds?.length) {
    return (
      <div className="container-custom py-md">
        <EmptyState
          icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
          title="No households selected"
          description="Select one or more households to view threads"
        />
      </div>
    );
  }

  if (!accessibleHouseholds.length) {
    return (
      <div className="container-custom py-md">
        <EmptyState
          icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
          title="No access"
          description="You don't have access to any of the selected households"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-md">
        <Card className="p-6 text-center">
          <h2 className="text-h4 text-red-500 mb-2">Failed to load threads</h2>
          <p className="text-text-secondary mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <main className="container-custom py-md">
        <div className="flex flex-col space-y-md">
          <header className="flex justify-between items-start">
            <div>
              <h1>Threads</h1>
              <p className="text-text-secondary">
                View and manage threads across your households
              </p>
            </div>
            {/* Add thread actions here later */}
          </header>

          {isLoadingThreads ? (
            <ThreadListSkeleton />
          ) : !threads?.length ? (
            <EmptyState
              icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
              title="No threads yet"
              description="Start a conversation in one of your households"
              action={<button className="btn-primary">Create Thread</button>}
            />
          ) : (
            <ThreadList threads={threads} />
          )}
        </div>
      </main>
    </ErrorBoundary>
  );
}
