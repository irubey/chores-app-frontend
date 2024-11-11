import React, { useEffect, useRef } from "react";
import { MessageWithDetails, User } from "@shared/types";
import MessageItem from "./MessageItem";
import Spinner from "@/components/common/Spinner";
import { useInView } from "react-intersection-observer";
import { useMessages } from "@/hooks/useMessages";
import { PaginationOptions } from "@shared/interfaces";
import { useThreads } from "@/hooks/useThreads";

interface MessageListProps {
  messages: MessageWithDetails[];
  isLoading: boolean;
  currentUser: User;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  currentUser,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { ref: loadMoreRef, inView } = useInView();
  const { hasMore, nextCursor, getMessages } = useMessages();
  const { selectedThread } = useThreads();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Load more messages when scrolling up
  useEffect(() => {
    if (inView && hasMore && selectedThread) {
      const paginationOptions: PaginationOptions = {
        cursor: nextCursor,
        limit: 20,
        direction: "desc",
        sortBy: "createdAt",
      };

      getMessages(
        selectedThread.householdId,
        selectedThread.id,
        paginationOptions
      );
    }
  }, [inView, hasMore, nextCursor, getMessages, selectedThread]);

  if (isLoading && !messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse p-4 space-y-reverse space-y-4 min-h-0">
      {/* Messages end marker for scrolling */}
      <div ref={messagesEndRef} />

      {/* Message list */}
      {messages.map((message, index) => {
        const showDateDivider =
          index === messages.length - 1 ||
          new Date(message.createdAt).toDateString() !==
            new Date(messages[index + 1].createdAt).toDateString();

        return (
          <React.Fragment key={message.id}>
            <MessageItem
              message={message}
              isLastInGroup={
                index === 0 || messages[index - 1].authorId !== message.authorId
              }
              currentUser={currentUser}
            />
            {showDateDivider && (
              <div className="flex items-center justify-center my-6">
                <div className="px-4 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs text-text-secondary">
                  {new Date(message.createdAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <Spinner className="h-6 w-6" />
        </div>
      )}
    </div>
  );
};

export default MessageList;
