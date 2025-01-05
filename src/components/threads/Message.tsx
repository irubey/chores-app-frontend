import React, { useState, memo } from "react";
import { MessageWithDetails } from "@shared/types";
import { useUser } from "@/hooks/users/useUser";
import { useMessageInteractions } from "@/hooks/threads/useMessageInteractions";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/api/logger";
import { Poll } from "@/components/threads/Poll/Poll";
import {
  PencilIcon,
  TrashIcon,
  FaceSmileIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { ReactionPicker } from "./reactions/ReactionPicker";
import { ReactionList } from "./reactions/ReactionList";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface MessageProps {
  readonly message: MessageWithDetails;
  readonly householdId: string;
  readonly threadId: string;
  readonly showAvatar?: boolean;
}

export const Message = memo<MessageProps>(
  ({ message, householdId, threadId, showAvatar = true }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    const { data: userData } = useUser();
    const currentUser = userData?.data;
    const isAuthor = currentUser?.id === message.authorId;

    const { updateMessage, deleteMessage } = useMessageInteractions({
      householdId,
      threadId,
      messageId: message.id,
    });

    const isOwnMessage = currentUser?.id === message.authorId;

    const handleDelete = () => {
      if (!window.confirm("Are you sure you want to delete this message?"))
        return;

      try {
        deleteMessage();
      } catch (err) {
        logger.error("Failed to delete message", {
          messageId: message.id,
          threadId,
          householdId,
          error: err,
        });
      }
    };

    const handleUpdate = () => {
      if (editContent.trim() === message.content) {
        setIsEditing(false);
        return;
      }

      try {
        updateMessage({ content: editContent.trim() });
        setIsEditing(false);
      } catch (err) {
        logger.error("Failed to update message", {
          messageId: message.id,
          threadId,
          householdId,
          error: err,
        });
      }
    };

    const handleCancelEdit = () => {
      setEditContent(message.content);
      setIsEditing(false);
    };

    // Safely format message content with mentions
    const renderContent = () => {
      if (!message.mentions?.length) return message.content;

      return message.content.split(/(@[\w\s]+)/g).map((part, idx) => {
        if (part.startsWith("@")) {
          const username = part.slice(1);
          const mention = message.mentions?.find(
            (m) => m.user.name.toLowerCase() === username.toLowerCase()
          );
          if (mention) {
            return (
              <span key={idx} className="text-primary font-medium">
                {part}
              </span>
            );
          }
        }
        return <span key={idx}>{part}</span>;
      });
    };

    return (
      <div
        className={cn(
          "group relative flex gap-4 px-4 py-3 transition-colors",
          "hover:bg-neutral-50 dark:hover:bg-neutral-800",
          isOwnMessage && "flex-row-reverse"
        )}
      >
        {/* Author Avatar */}
        {showAvatar && (
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
              {message.author.name[0].toUpperCase()}
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={cn("flex-grow min-w-0", isOwnMessage && "items-end")}>
          {/* Message Header */}
          <div
            className={cn(
              "flex items-baseline gap-2 mb-1",
              isOwnMessage && "flex-row-reverse"
            )}
          >
            <span className="font-semibold text-text-primary dark:text-text-secondary">
              {message.author.name}
            </span>
            <span className="text-xs text-text-secondary">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
              })}
              {message.updatedAt !== message.createdAt && " (edited)"}
            </span>
          </div>

          {/* Message Body */}
          <div
            className={cn(
              "text-text-primary dark:text-text-secondary",
              isOwnMessage && "text-right"
            )}
          >
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="input min-h-[60px] max-h-[200px] resize-y w-full"
                  rows={1}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="btn btn-primary btn-sm"
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "whitespace-pre-wrap",
                  "inline-block max-w-[80%] rounded-lg p-2",
                  isOwnMessage
                    ? "bg-primary text-white ml-auto"
                    : "bg-neutral-100 dark:bg-neutral-800"
                )}
              >
                {renderContent()}
              </div>
            )}
          </div>

          {/* Poll (if exists) */}
          {message.poll && (
            <div className={cn(isOwnMessage && "flex justify-end")}>
              <ErrorBoundary>
                <Poll
                  poll={message.poll}
                  householdId={householdId}
                  threadId={threadId}
                  messageId={message.id}
                  isAuthor={isAuthor}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* Reactions */}
          <div className={cn("mt-2", isOwnMessage && "flex justify-end")}>
            <ReactionList reactions={message.reactions || []} />
          </div>
        </div>

        {/* Message Actions */}
        {!isEditing && (
          <div
            className={cn(
              "absolute top-3 flex gap-2",
              isOwnMessage ? "left-4" : "right-4",
              "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            <button
              onClick={() => setShowReactionPicker(true)}
              className="text-text-secondary hover:text-primary p-1 rounded"
              aria-label="Add reaction"
            >
              <FaceSmileIcon className="h-4 w-4" />
            </button>
            {isAuthor && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-text-secondary hover:text-primary p-1 rounded"
                  aria-label="Edit message"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-text-secondary hover:text-red-500 p-1 rounded"
                  aria-label="Delete message"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Reaction Picker */}
        {showReactionPicker && (
          <ReactionPicker
            messageId={message.id}
            threadId={threadId}
            onClose={() => setShowReactionPicker(false)}
            position={isOwnMessage ? "left" : "right"}
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Deep compare reactions arrays
    const areReactionsEqual =
      prevProps.message.reactions?.length ===
        nextProps.message.reactions?.length &&
      prevProps.message.reactions?.every(
        (prevReaction, index) =>
          prevReaction.id === nextProps.message.reactions?.[index].id
      );

    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.updatedAt === nextProps.message.updatedAt &&
      prevProps.showAvatar === nextProps.showAvatar &&
      areReactionsEqual
    );
  }
);

Message.displayName = "Message";
