"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useAuthUser, useAuthStatus } from "@/contexts/UserContext";
import { useHouseholds } from "@/hooks/useHouseholds";
import { useThreads } from "@/hooks/threads/useThreads";
import { logger } from "@/lib/api/logger";
import { ThreadList } from "@/components/threads/ThreadList";
import { ThreadCreator } from "@/components/threads/ThreadCreator";
import { ThreadListSkeleton } from "@/components/threads/skeletons/ThreadCardSkeleton";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/outline";

const THREADS_PER_PAGE = 20;

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-8 text-center animate-fade-in">
      <div className="flex flex-col items-center space-y-4">
        <div className="text-primary dark:text-primary-light">{icon}</div>
        <h2 className="text-h3 mb-2">{title}</h2>
        <p className="text-text-secondary dark:text-text-secondary mb-0">
          {description}
        </p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </Card>
  );
}

export default function ThreadsPage() {
  const user = useAuthUser();
  const { status } = useAuthStatus();
  const { data: householdsData, isLoading: isLoadingHouseholds } =
    useHouseholds();
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Filter accessible households
  const accessibleHouseholds = useMemo(() => {
    if (!householdsData?.data?.length || !user?.id) {
      logger.debug("No households to check or no user", {
        hasHouseholds: !!householdsData?.data?.length,
        userId: user?.id,
      });
      return [];
    }

    return householdsData.data.filter((h) => {
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
  }, [householdsData?.data, user?.id]);

  // Query threads from accessible households
  const {
    data: threadsData,
    isLoading: isLoadingThreads,
    error,
  } = useThreads({
    householdIds: accessibleHouseholds.map((h) => h.id),
    limit: THREADS_PER_PAGE,
    enabled: !!user && accessibleHouseholds.length > 0,
  });

  const threads = threadsData?.data || [];
  const isLoading = status === "loading" || isLoadingHouseholds;

  const handleThreadCreated = useCallback(() => {
    setIsCreatorOpen(false);
    logger.debug("Thread created, closing creator");
  }, []);

  logger.debug("Rendering threads page", {
    threadsCount: threads?.length,
    selectedHouseholds: {
      total: householdsData?.data?.length,
      accessible: accessibleHouseholds.length,
      ids: householdsData?.data?.map((h) => h.id),
      accessibleIds: accessibleHouseholds.map((h) => h.id),
    },
    isLoadingThreads,
    isLoadingHouseholds,
    authStatus: status,
    isAuthenticated: !!user,
    hasUser: !!user,
  });

  if (isLoading) {
    return (
      <div className="container-custom py-md animate-fade-in">
        <ThreadListSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-custom py-md animate-fade-in">
        <EmptyState
          icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
          title="Please sign in"
          description="You need to be signed in to view threads"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-md animate-fade-in">
        <EmptyState
          icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
          title="Error loading threads"
          description={error.message}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <main className="container-custom py-md animate-fade-in">
      <div className="flex flex-col space-y-md">
        <header className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-md">
          <div>
            <h1 className="mb-2">Threads</h1>
            <p className="text-text-secondary dark:text-text-secondary mb-0">
              View and manage threads across your households
            </p>
          </div>
          {accessibleHouseholds.length > 0 && (
            <Button
              variant="primary"
              onClick={() => setIsCreatorOpen(true)}
              icon={<PlusIcon className="h-5 w-5" />}
            >
              New Thread
            </Button>
          )}
        </header>

        {isLoadingThreads ? (
          <ThreadListSkeleton />
        ) : !threads?.length ? (
          <EmptyState
            icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
            title="No threads yet"
            description="Start a conversation in one of your households"
            action={
              <Button
                variant="primary"
                onClick={() => setIsCreatorOpen(true)}
                disabled={accessibleHouseholds.length === 0}
              >
                Create Thread
              </Button>
            }
          />
        ) : (
          <div className="animate-slide-up">
            <ThreadList threads={threads} />
          </div>
        )}
      </div>

      <ThreadCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onSuccess={handleThreadCreated}
      />
    </main>
  );
}
