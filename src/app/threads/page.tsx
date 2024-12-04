"use client";

import { useThreads } from "@/hooks/threads/useThreads";
import { ThreadList } from "@/components/threads/ThreadList";
import { ThreadListSkeleton } from "@/components/threads/skeletons/ThreadCardSkeleton";
import { useHouseholds } from "@/contexts/HouseholdsContext";

export default function ThreadsPage() {
  const { selectedHouseholds } = useHouseholds();
  const { threads, isLoading, error } = useThreads({
    initialPageSize: 20,
    autoRefreshInterval: 30000,
  });

  if (error) {
    return (
      <div className="container-custom py-md">
        <div className="text-red-500">
          Failed to load threads: {error.message}
        </div>
      </div>
    );
  }

  return (
    <main className="container-custom py-md">
      <div className="flex flex-col space-y-md">
        <header>
          <h1>Threads</h1>
          <p className="text-text-secondary">
            View and manage threads across your households
          </p>
        </header>

        {isLoading ? <ThreadListSkeleton /> : <ThreadList threads={threads} />}
      </div>
    </main>
  );
}
