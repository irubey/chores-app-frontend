import React, { useState } from "react";
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
} from "@heroicons/react/24/outline";
import { ReactionPicker } from "./reactions/ReactionPicker";
import { ReactionList } from "./reactions/ReactionList";

interface MessageProps {
  readonly message: MessageWithDetails;
  readonly householdId: string;
  readonly threadId: string;
  readonly isEditing: boolean;
  readonly onEditClick: () => void;
  readonly onDeleteClick: () => void;
}

export const Message: React.FC<MessageProps> = ({
  message,
  householdId,
  threadId,
  isEditing,
  onEditClick,
  onDeleteClick,
}) => {
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

  const handleDelete = async () => {
    try {
      await deleteMessage.mutateAsync();
      onDeleteClick();
      logger.info("Message deleted", {
        messageId: message.id,
        threadId,
        householdId,
      });
    } catch (error) {
      logger.error("Failed to delete message", {
        messageId: message.id,
        threadId,
        householdId,
        error,
      });
    }
  };

  const handleUpdate = async () => {
    if (editContent.trim() === message.content) {
      onEditClick(); // Cancel edit mode
      return;
    }

    try {
      await updateMessage.mutateAsync({ content: editContent.trim() });
      onEditClick(); // Exit edit mode
      logger.info("Message updated", {
        messageId: message.id,
        threadId,
        householdId,
      });
    } catch (error) {
      logger.error("Failed to update message", {
        messageId: message.id,
        threadId,
        householdId,
        error,
      });
    }
  };

  // Safely format message content with mentions
  const renderContent = () => {
    if (!message.mentions?.length) return message.content;

    let parts = message.content.split(/(@[\w\s]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const username = part.slice(1);
        const mention = message.mentions?.find(
          (m) => m.user.name.toLowerCase() === username.toLowerCase()
        );
        if (mention) {
          return (
            <span key={index} className="text-primary font-medium">
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };

  return (
    <div
      className={cn(
        "group relative flex gap-4 px-4 py-3 transition-colors",
        "hover:bg-neutral-50 dark:hover:bg-neutral-800"
      )}
    >
      {/* Author Avatar */}
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
          {message.author.name[0].toUpperCase()}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-grow min-w-0">
        {/* Message Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-text-primary dark:text-text-secondary">
            {message.author.name}
          </span>
          <span className="text-xs text-text-secondary">
            {formatDistanceToNow(new Date(message.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Message Body */}
        <div className="text-text-primary dark:text-text-secondary">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input min-h-[60px] max-h-[200px] resize-y w-full"
                rows={1}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="btn btn-primary btn-sm"
                >
                  Save
                </button>
                <button
                  onClick={onEditClick}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Poll (if exists) */}
        {message.poll && (
          <Poll
            poll={message.poll}
            householdId={householdId}
            threadId={threadId}
            messageId={message.id}
            isAuthor={isAuthor}
          />
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-2">
            <ReactionList reactions={message.reactions} />
          </div>
        )}
      </div>

      {/* Message Actions */}
      <div
        className={cn(
          "absolute right-4 top-3 flex gap-2",
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
              onClick={onEditClick}
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

      {/* Reaction Picker */}
      {showReactionPicker && (
        <ReactionPicker
          messageId={message.id}
          onClose={() => setShowReactionPicker(false)}
        />
      )}
    </div>
  );
};
