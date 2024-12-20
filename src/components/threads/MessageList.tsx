import React, { useRef, useEffect } from "react";
import { Message } from "./Message";
import { ThreadWithDetails } from "@shared/types";
import { MessageListSkeleton } from "./skeletons/MessageSkeleton";
import { format, isToday, isYesterday, isSameDay } from "date-fns";

interface MessageListProps {
  readonly thread: ThreadWithDetails;
  readonly isLoading?: boolean;
}

interface MessageGroup {
  date: Date;
  messages: ThreadWithDetails["messages"];
}

export function MessageList({ thread, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread.messages?.length]);

  if (isLoading) {
    return <MessageListSkeleton />;
  }

  if (!thread.messages?.length) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        No messages yet
      </div>
    );
  }

  // Group messages by date
  const messageGroups = thread.messages.reduce<MessageGroup[]>(
    (groups, message) => {
      const messageDate = new Date(message.createdAt);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && isSameDay(lastGroup.date, messageDate)) {
        lastGroup.messages.push(message);
      } else {
        groups.push({
          date: messageDate,
          messages: [message],
        });
      }

      return groups;
    },
    []
  );

  const getDateLabel = (date: Date) => {
    if (isToday(date)) {
      return "Today";
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    return format(date, "MMMM d, yyyy");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-8">
        {messageGroups.map((group, groupIndex) => (
          <div key={group.date.toISOString()} className="space-y-4">
            <div className="sticky top-0 z-10 flex justify-center">
              <span className="px-2 py-1 text-xs text-text-secondary bg-background/80 dark:bg-background-dark/80 rounded">
                {getDateLabel(group.date)}
              </span>
            </div>
            <div className="space-y-1">
              {group.messages.map((message, messageIndex) => (
                <Message
                  key={`${message.id}-${message.updatedAt}`}
                  message={message}
                  householdId={thread.householdId}
                  threadId={thread.id}
                  showAvatar={
                    messageIndex === 0 ||
                    group.messages[messageIndex - 1]?.authorId !==
                      message.authorId
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
