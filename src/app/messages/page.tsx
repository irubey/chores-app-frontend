"use client";

import { useMessages } from "@/hooks/useMessages";
import { useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import ThreadList from "@/components/messages/ThreadList/ThreadList";
import MessageList from "@/components/messages/MessageList/MessageList";
import ThreadHeader from "@/components/messages/ThreadHeader";
import MessageInput from "@/components/messages/MessageInput";
import NewThreadModal from "@/components/messages/NewThreadModal";
import { useThreads } from "@/hooks/useThreads";
import { User, ThreadWithDetails, HouseholdWithMembers } from "@shared/types";
import { PaginationOptions } from "@shared/interfaces";
import Spinner from "@/components/common/Spinner";
import { logger } from "@/lib/api/logger";

// Move interfaces to separate types file
interface MessagesPageProps {
  user?: User;
  selectedHouseholds?: HouseholdWithMembers[];
}

const THREADS_PER_PAGE = 20;

const MessagesPage: React.FC<MessagesPageProps> = ({
  user,
  selectedHouseholds,
}) => {
  const { messages, messageStatus, getMessages } = useMessages();
  const {
    threads,
    selectedThread,
    threadStatus,
    hasMore,
    nextCursor,
    getThreads,
    getThreadDetails,
  } = useThreads();

  const params = useParams();
  const threadId = params?.threadId as string;

  // Memoize thread with details to prevent unnecessary rerenders
  const threadWithDetails = useMemo(() => {
    if (!selectedThread) return null;
    return selectedThread as ThreadWithDetails;
  }, [selectedThread]);

  // Memoize the loadThreads function
  const loadThreads = useCallback(
    async (householdId: string, isInitial: boolean = false) => {
      logger.info("Loading threads", { householdId, isInitial });

      const paginationOptions: PaginationOptions = {
        limit: THREADS_PER_PAGE,
        cursor: isInitial ? undefined : nextCursor,
        direction: "desc",
        sortBy: "updatedAt",
      };

      try {
        await getThreads(householdId, paginationOptions);
      } catch (error) {
        logger.error("Failed to load threads", { error, householdId });
      }
    },
    [nextCursor, getThreads]
  );

  // Load initial threads once when households are available
  useEffect(() => {
    if (!selectedHouseholds?.length) {
      logger.info("Waiting for households from layout");
      return;
    }

    logger.info("Loading initial threads", {
      householdCount: selectedHouseholds.length,
      households: selectedHouseholds.map((h) => h.id),
    });

    // Load threads for each household
    selectedHouseholds.forEach((household) => {
      loadThreads(household.id, true);
    });
  }, [selectedHouseholds, loadThreads]);

  // Load thread details when thread is selected
  useEffect(() => {
    if (!threadId || !selectedThread?.householdId) return;

    const loadThreadDetails = async () => {
      logger.info("Loading thread details", { threadId });

      try {
        await getMessages(selectedThread.householdId, threadId);
        await getThreadDetails(selectedThread.householdId, threadId);
      } catch (error) {
        logger.error("Failed to load thread details", { error, threadId });
      }
    };

    loadThreadDetails();
  }, [threadId, selectedThread?.householdId]);

  // Handle loading more threads
  const handleLoadMore = () => {
    if (selectedHouseholds?.length > 0 && hasMore) {
      logger.info("Loading more threads");
      selectedHouseholds.forEach((household) => {
        loadThreads(household.id);
      });
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left sidebar with threads */}
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <NewThreadModal />
        </div>
        <div className="flex-1 overflow-y-auto">
          <ThreadList
            threads={threads as ThreadWithDetails[]}
            selectedThreadId={threadId}
            loadMore={handleLoadMore}
            hasMore={hasMore}
            isLoading={threadStatus.list === "loading"}
            selectedHouseholds={selectedHouseholds || []}
          />
        </div>
      </div>

      {/* Main message area */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col">
          {threadWithDetails ? (
            <ThreadHeader thread={threadWithDetails} />
          ) : (
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <Spinner className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <MessageList
              messages={messages}
              isLoading={messageStatus.list === "loading"}
              currentUser={user}
            />
          </div>
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <MessageInput
              householdId={selectedThread.householdId}
              threadId={selectedThread.id}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-h3 mb-4">Select a thread to start messaging</h3>
            <p className="text-text-secondary mb-6">
              Choose an existing thread or create a new one
            </p>
            <NewThreadModal />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
