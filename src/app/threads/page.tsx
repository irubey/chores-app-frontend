"use client";

import React, { useState, useCallback } from "react";
import { useUser } from "@/hooks/users/useUser";
import { useThreads } from "@/hooks/threads/useThreads";
import { logger } from "@/lib/api/logger";
import { ThreadList } from "@/components/threads/ThreadList";
import { ThreadCreator } from "@/components/threads/ThreadCreator";
import { ThreadListSkeleton } from "@/components/threads/skeletons/ThreadCardSkeleton";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/outline";
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
  const { data: userData, isLoading: isLoadingUser } = useUser();
  const user = userData?.data;
  const activeHouseholdId = user?.activeHouseholdId;
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const {
    data: threads = [] as ThreadWithDetails[],
    isLoading: isLoadingThreads,
    error,
  } = useThreads({
    householdId: activeHouseholdId ?? "",
    requestOptions: {
      params: {
        limit: THREADS_PER_PAGE,
      },
    },
    enabled: Boolean(activeHouseholdId),
  });

  const isLoading = isLoadingUser || (isLoadingThreads && threads.length === 0);

  const handleThreadCreated = useCallback(() => {
    setIsCreatorOpen(false);
    logger.debug("Thread created, closing creator");
  }, []);

  logger.debug("Rendering threads page", {
    threadsCount: threads.length,
    activeHouseholdId,
    isLoadingThreads,
    isLoadingUser,
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

  if (!activeHouseholdId) {
    return (
      <div className="container-custom py-md animate-fade-in">
        <EmptyState
          icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
          title="No active household"
          description="Please select a household to view threads"
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
          description={error instanceof Error ? error.message : "Unknown error"}
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
              View and manage threads in your household
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreatorOpen(true)}
            icon={<PlusIcon className="h-5 w-5" />}
          ></Button>
        </header>

        {threads.length === 0 ? (
          <EmptyState
            icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
            title="No threads yet"
            description="Start a conversation in your household"
            action={
              <Button variant="primary" onClick={() => setIsCreatorOpen(true)}>
                Create Thread
              </Button>
            }
          />
        ) : (
          <div className="animate-slide-up">
            <ThreadList threads={threads as ThreadWithDetails[]} />
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
