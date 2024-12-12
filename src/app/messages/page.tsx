"use client";

import { useMessages } from "@/hooks/useMessages";
import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import ThreadList from "@/components/messages/ThreadList/ThreadList";
import MessageList from "@/components/messages/MessageList/MessageList";
import ThreadHeader from "@/components/messages/ThreadHeader";
import MessageInput from "@/components/messages/MessageInput";
import NewThreadModal from "@/components/messages/NewThreadModal";
import { useThread } from "@/hooks/useThreads";
import Spinner from "@/components/common/Spinner";
import { logger } from "@/lib/api/logger";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";

const MessagesPage = () => {
  const params = useParams();
  const threadId = params?.threadId as string;

  // Get user and household from hooks
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();

  // Initialize hooks with current household
  const {
    threads,
    selectedThread,
    isLoading: isThreadLoading,
    error: threadError,
    hasMore,
    createThread,
    getThreadDetails,
    loadMore,
    refresh: refreshThreads,
  } = useThread(currentHousehold?.id || "", {
    pageSize: 20,
  });

  const {
    messages,
    isLoading: isMessagesLoading,
    error: messagesError,
    hasMore: hasMoreMessages,
    sendMessage,
    loadMore: loadMoreMessages,
    refresh: refreshMessages,
  } = useMessages(currentHousehold?.id || "", threadId || "", {
    pageSize: 20,
  });

  // Load thread details when thread is selected
  useEffect(() => {
    if (!threadId || !currentHousehold?.id) return;

    logger.debug("Loading thread details", {
      threadId,
      householdId: currentHousehold.id,
    });

    getThreadDetails(threadId).catch((error) => {
      logger.error("Failed to load thread details", { error });
    });
  }, [threadId, currentHousehold?.id, getThreadDetails]);

  // Memoize selected thread details
  const threadWithDetails = useMemo(() => {
    return selectedThread;
  }, [selectedThread]);

  if (!currentHousehold) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-secondary">Please select a household first</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left sidebar with threads */}
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <NewThreadModal onCreateThread={createThread} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <ThreadList
            threads={threads}
            selectedThreadId={threadId}
            loadMore={loadMore}
            hasMore={hasMore}
            isLoading={isThreadLoading}
            error={threadError}
            selectedHousehold={currentHousehold}
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
              isLoading={isMessagesLoading}
              error={messagesError}
              hasMore={hasMoreMessages}
              onLoadMore={loadMoreMessages}
              currentUser={user}
            />
          </div>
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <MessageInput
              onSendMessage={sendMessage}
              householdId={currentHousehold.id}
              threadId={threadId}
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
            <NewThreadModal onCreateThread={createThread} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
