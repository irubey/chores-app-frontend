"use client";

import { useMessages } from "@/hooks/useMessages";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ThreadList from "@/components/messages/ThreadList/ThreadList";
import MessageList from "@/components/messages/MessageList/MessageList";
import ThreadHeader from "@/components/messages/ThreadHeader";
import MessageInput from "@/components/messages/MessageInput";
import NewThreadModal from "@/components/messages/NewThreadModal";
import { useThreads } from "@/hooks/useThreads";
import {
  User,
  ThreadWithParticipants,
  ThreadWithDetails,
  HouseholdWithMembers,
} from "@shared/types";
import { PaginationOptions } from "@shared/interfaces";
import Spinner from "@/components/common/Spinner";

interface MessagesPageProps {
  user?: User;
  selectedHouseholds?: HouseholdWithMembers[];
}

interface ThreadListProps {
  threads: ThreadWithDetails[];
  selectedThreadId?: string;
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

interface MessageInputProps {
  householdId: string;
  threadId: string;
}

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

  const [threadWithParticipants, setThreadWithParticipants] =
    useState<ThreadWithParticipants | null>(null);

  const params = useParams();
  const threadId = params?.threadId as string;

  // Pagination options
  const THREADS_PER_PAGE = 20;

  const loadThreads = async (
    householdId: string,
    isInitial: boolean = false
  ) => {
    const paginationOptions: PaginationOptions = {
      limit: THREADS_PER_PAGE,
      cursor: isInitial ? undefined : nextCursor,
      direction: "desc",
      sortBy: "updatedAt",
    };

    try {
      await getThreads(householdId, paginationOptions);
    } catch (error) {
      console.error("Failed to load threads:", error);
    }
  };

  // Initial load of threads for each household
  useEffect(() => {
    if (selectedHouseholds?.length > 0) {
      selectedHouseholds.forEach((household) => {
        loadThreads(household.id, true);
      });
    }
  }, [selectedHouseholds]);

  // Load thread details when a thread is selected
  useEffect(() => {
    if (threadId && selectedThread?.householdId) {
      getMessages(selectedThread.householdId, threadId);
      getThreadDetails(selectedThread.householdId, threadId)
        .then((thread) => {
          if (thread && "participants" in thread) {
            setThreadWithParticipants(thread as ThreadWithParticipants);
          }
        })
        .catch((error) => {
          console.error("Failed to load thread details:", error);
        });
    }
  }, [threadId, selectedThread?.householdId, getMessages, getThreadDetails]);

  // Handle loading more threads
  const handleLoadMore = () => {
    if (selectedHouseholds?.length > 0 && hasMore) {
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
            threads={threads}
            selectedThreadId={threadId}
            loadMore={handleLoadMore}
            hasMore={hasMore}
            isLoading={threadStatus.list === "loading"}
          />
        </div>
      </div>

      {/* Main message area */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col">
          {threadWithParticipants ? (
            <ThreadHeader thread={threadWithParticipants} />
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
