import React, { useState, useRef, useEffect } from "react";
import { Message } from "./Message";
import MessageInput from "./MessageInput";
import { ThreadWithDetails } from "@shared/types";
import { MessageListSkeleton } from "./skeletons/MessageSkeleton";

interface MessageListProps {
  readonly thread: ThreadWithDetails;
  readonly isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  thread,
  isLoading = false,
}) => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
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
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          No messages yet
        </div>
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <MessageInput thread={thread} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {thread.messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              householdId={thread.householdId}
              threadId={thread.id}
              isEditing={editingMessageId === message.id}
              onEditClick={() => setEditingMessageId(message.id)}
              onDeleteClick={() => setEditingMessageId(null)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};
