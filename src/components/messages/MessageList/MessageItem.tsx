//Purpose:Represents an individual message, displaying content, author information, timestamp, reactions, and attachments.

import React, { useState } from "react";
import { MessageWithDetails, User } from "@shared/types";
import { format } from "date-fns";
import MessageReactions from "./MessageReactions";
import MessageAttachments from "./MessageAttachments";
import MessagePoll from "./MessagePoll";
import MessageMentions from "./MessageMentions";
import MessageActions from "./MessageActions";

interface MessageItemProps {
  message: MessageWithDetails;
  isLastInGroup: boolean;
  currentUser: User;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isLastInGroup,
  currentUser,
}) => {
  const [showActions, setShowActions] = useState(false);
  const isOwnMessage = message.authorId === currentUser?.id;

  return (
    <div
      className={`group relative flex gap-3 ${isLastInGroup ? "mb-3" : "mb-1"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Author Avatar */}
      {isLastInGroup && (
        <div className="flex-shrink-0 w-8 h-8">
          <img
            src={message.author.profileImageURL || "/default-avatar.png"}
            alt={message.author.name}
            className="rounded-full"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Message Header */}
        {isLastInGroup && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{message.author.name}</span>
            <span className="text-xs text-text-secondary">
              {format(new Date(message.createdAt), "h:mm a")}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div className="relative group">
          <div
            className={`prose prose-sm max-w-none text-text-primary dark:text-text-secondary
              ${!isLastInGroup ? "ml-8" : ""}`}
          >
            {message.content}
          </div>

          {/* Message Actions */}
          {showActions && (
            <div className="absolute -right-2 -top-2 translate-x-full">
              <MessageActions message={message} isOwnMessage={isOwnMessage} />
            </div>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <MessageAttachments
            attachments={message.attachments}
            messageId={message.id}
            threadId={message.threadId}
            householdId={message.thread.householdId}
            isOwnMessage={isOwnMessage}
          />
        )}

        {/* Poll */}
        {message.poll && (
          <MessagePoll
            poll={message.poll}
            messageId={message.id}
            threadId={message.threadId}
            householdId={message.thread.householdId}
            currentUser={currentUser}
          />
        )}

        {/* Mentions */}
        {message.mentions && message.mentions.length > 0 && (
          <MessageMentions
            mentions={message.mentions}
            messageId={message.id}
            threadId={message.threadId}
            householdId={message.thread.householdId}
            isOwnMessage={isOwnMessage}
          />
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <MessageReactions
            reactions={message.reactions}
            messageId={message.id}
            threadId={message.threadId}
            householdId={message.thread.householdId}
            currentUserId={currentUser?.id}
          />
        )}
      </div>
    </div>
  );
};

export default MessageItem;
