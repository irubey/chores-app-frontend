import React from "react";
import { ThreadWithDetails, HouseholdWithMembers } from "@shared/types";
import ThreadItem from "./ThreadItem";
import Spinner from "@/components/common/Spinner";
import NewThreadModal from "../NewThreadModal";
import { logger } from "@/lib/api/logger";

interface ThreadListProps {
  threads: ThreadWithDetails[];
  selectedThreadId?: string;
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  selectedHouseholds: HouseholdWithMembers[];
}

const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  selectedThreadId,
  loadMore,
  hasMore,
  isLoading,
  selectedHouseholds,
}) => {
  if (isLoading && !threads.length) {
    return (
      <div data-testid="thread-list-loading" role="progressbar">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Thread List Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <h2 className="text-h5 mb-0">Threads</h2>
          <NewThreadModal />
        </div>
        {/* Selected Households Pills */}
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedHouseholds.map((household) => (
            <span key={household.id} className="badge badge-primary text-xs">
              {household.name}
            </span>
          ))}
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {threads.length > 0 ? (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {threads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isSelected={thread.id === selectedThreadId}
                householdName={
                  selectedHouseholds.find((h) => h.id === thread.householdId)
                    ?.name
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-text-secondary mb-4">No threads yet</p>
            <NewThreadModal />
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="btn btn-secondary w-full"
          >
            {isLoading ? <Spinner className="h-5 w-5" /> : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThreadList;
