"use client";

import React, { useState, useCallback } from "react";
import { useAuthUser, useAuthStatus } from "@/contexts/UserContext";
import { useThreads } from "@/hooks/threads/useThreads";
import { useSelectedHouseholds } from "@/hooks/households/useSelectedHouseholds";
import { logger } from "@/lib/api/logger";
import { ThreadList } from "@/components/threads/ThreadList";
import { ThreadCreator } from "@/components/threads/ThreadCreator";
import { ThreadListSkeleton } from "@/components/threads/skeletons/ThreadCardSkeleton";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ApiResponse } from "@shared/interfaces/apiResponse";
import type { ThreadWithDetails } from "@shared/types";

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
  const { selectedHouseholds, isLoading: isLoadingHouseholds } =
    useSelectedHouseholds();
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Query threads from accessible households
  const {
    data: threadsData,
    isLoading: isLoadingThreads,
    error,
    queries,
  } = useThreads({
    householdIds: selectedHouseholds.accessibleIds,
    limit: THREADS_PER_PAGE,
    enabled: status === "authenticated" && selectedHouseholds.accessible > 0,
  });

  const threads = threadsData?.data || [];
  // Only show initial loading when auth or households are loading
  const isInitialLoading = status === "loading" || isLoadingHouseholds;
  // Only show thread loading when we have no threads yet and queries are in flight
  const isThreadsLoading =
    isLoadingThreads && !threads.length && queries?.some((q) => q.isFetching);

  const handleThreadCreated = useCallback(() => {
    setIsCreatorOpen(false);
    logger.debug("Thread created, closing creator");
  }, []);

  logger.debug("Rendering threads page", {
    threadsCount: threads?.length,
    selectedHouseholds,
    isLoadingThreads,
    isThreadsLoading,
    isLoadingHouseholds,
    isInitialLoading,
    authStatus: status,
    isAuthenticated: status === "authenticated",
    hasUser: !!user,
    queriesStatus: queries?.map(
      (q: UseQueryResult<ApiResponse<ThreadWithDetails[]>, Error>) => ({
        isFetching: q.isFetching,
        isLoading: q.isLoading,
        dataUpdatedAt: q.dataUpdatedAt,
        status: q.status,
      })
    ),
  });

  // Only show loading skeleton on initial load
  if (isInitialLoading || isThreadsLoading) {
    return (
      <div className="container-custom py-md animate-fade-in">
        <ThreadListSkeleton />
      </div>
    );
  }

  if (status !== "authenticated") {
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
          {selectedHouseholds.accessible > 0 && (
            <Button
              variant="primary"
              onClick={() => setIsCreatorOpen(true)}
              icon={<PlusIcon className="h-5 w-5" />}
            >
              New Thread
            </Button>
          )}
        </header>

        {!threads?.length ? (
          <EmptyState
            icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
            title="No threads yet"
            description="Start a conversation in one of your households"
            action={
              <Button
                variant="primary"
                onClick={() => setIsCreatorOpen(true)}
                disabled={selectedHouseholds.accessible === 0}
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
