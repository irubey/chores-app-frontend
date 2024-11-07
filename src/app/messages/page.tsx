"use client";

import { useMessages } from "@/hooks/useMessages";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ThreadList from "@/components/messages/ThreadList/ThreadList";
import MessageList from "@/components/messages/MessageList/MessageList";
import ThreadHeader from "@/components/messages/ThreadHeader";
import MessageInput from "@/components/messages/MessageInput";
import NewThreadModal from "@/components/messages/NewThreadModal";
import { useHousehold } from "@/hooks/useHousehold";
import { User, ThreadWithParticipants } from "@shared/types";
import Spinner from "@/components/common/Spinner";
import { PayloadAction } from "@reduxjs/toolkit";

interface MessagesPageProps {
  user?: User;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ user }) => {
  const {
    threads,
    messages,
    selectedThread,
    messageStatus,
    threadStatus,
    getThreads,
    getMessages,
    selectThreadById,
    getThreadDetails,
  } = useMessages();

  const [threadWithParticipants, setThreadWithParticipants] =
    useState<ThreadWithParticipants | null>(null);
  const { selectedHouseholds, getSelectedHouseholds } = useHousehold();
  const params = useParams();
  const threadId = params?.threadId as string;

  useEffect(() => {
    getSelectedHouseholds();
  }, [getSelectedHouseholds]);

  useEffect(() => {
    if (selectedHouseholds.length > 0) {
      selectedHouseholds.forEach((household) => {
        getThreads(household.id);
      });
    }
  }, [selectedHouseholds, getThreads]);

  useEffect(() => {
    if (threadId && selectedThread?.householdId) {
      getMessages(selectedThread.householdId, threadId);
      getThreadDetails(selectedThread.householdId, threadId).then(
        (action: PayloadAction<any>) => {
          if (
            action.payload &&
            typeof action.payload === "object" &&
            "participants" in action.payload
          ) {
            setThreadWithParticipants(action.payload as ThreadWithParticipants);
          }
        }
      );
      selectThreadById(threadId);
    }
  }, [
    threadId,
    selectedThread?.householdId,
    getMessages,
    getThreadDetails,
    selectThreadById,
  ]);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left sidebar with threads */}
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700"></div>
        <ThreadList threads={threads} selectedThreadId={threadId} />
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
            <MessageInput threadId={selectedThread.id} />
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
