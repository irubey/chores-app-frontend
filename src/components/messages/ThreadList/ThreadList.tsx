import React from "react";
import { Thread } from "@shared/types";
import ThreadItem from "./ThreadItem";
import Spinner from "@/components/common/Spinner";
import { useHousehold } from "@/hooks/useHousehold";
import NewThreadModal from "../NewThreadModal";
import { useEffect } from "react";

interface ThreadListProps {
  threads: Thread[];
  selectedThreadId?: string;
}

const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  selectedThreadId,
}) => {
  const { selectedHouseholds, getSelectedHouseholds, status } = useHousehold();

  useEffect(() => {
    getSelectedHouseholds();
  }, [getSelectedHouseholds]);

  if (status.list === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (selectedHouseholds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">No households selected</p>
          <p className="text-sm text-text-secondary mb-4">
            Select households in settings to view their threads
          </p>
        </div>
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
    </div>
  );
};

export default ThreadList;
