import React from "react";
import { MentionWithUser } from "@shared/types";
import { AtSymbolIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMessages } from "@/hooks/useMessages";

interface MessageMentionsProps {
  mentions: MentionWithUser[];
  messageId: string;
  threadId: string;
  householdId: string;
  isOwnMessage: boolean;
}

const MessageMentions: React.FC<MessageMentionsProps> = ({
  mentions,
  messageId,
  threadId,
  householdId,
  isOwnMessage,
}) => {
  const { deleteMessageMention } = useMessages();

  const handleRemoveMention = async (mentionId: string) => {
    try {
      await deleteMessageMention(householdId, threadId, messageId, mentionId);
    } catch (error) {
      console.error("Failed to remove mention:", error);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {mentions.map((mention) => (
        <div key={mention.id} className="group relative inline-flex">
          <Link
            href={`/profile/${mention.userId}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm 
                     bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light
                     hover:bg-primary-dark hover:text-white dark:hover:bg-primary dark:hover:text-white
                     transition-colors duration-200"
          >
            <AtSymbolIcon className="h-4 w-4" />
            <span>{mention.user.name}</span>
          </Link>

          {/* Remove button (if own message) */}
          {isOwnMessage && (
            <button
              onClick={() => handleRemoveMention(mention.id)}
              className="absolute -right-2 -top-2 p-1 rounded-full bg-white dark:bg-background-dark 
                       text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                       opacity-0 group-hover:opacity-100 focus:opacity-100
                       shadow-sm border border-neutral-200 dark:border-neutral-700
                       transition-all duration-200"
              aria-label={`Remove mention of ${mention.user.name}`}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageMentions;
