import React, { useState } from "react";
import { MessageWithDetails } from "@shared/types";
import { ReactionType } from "@shared/enums";
import {
  FaceSmileIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  HandThumbUpIcon,
  HeartIcon,
  FaceSmileIcon as SmileIcon,
  EyeIcon,
  FaceFrownIcon,
  FireIcon,
} from "@heroicons/react/24/solid";
import { useMessages } from "@/hooks/useMessages";

interface MessageActionsProps {
  message: MessageWithDetails;
  isOwnMessage: boolean;
}

const REACTIONS = [
  { type: ReactionType.LIKE, emoji: "👍", icon: HandThumbUpIcon },
  { type: ReactionType.LOVE, emoji: "❤️", icon: HeartIcon },
  { type: ReactionType.HAHA, emoji: "😄", icon: SmileIcon },
  { type: ReactionType.WOW, emoji: "😮", icon: EyeIcon },
  { type: ReactionType.SAD, emoji: "😢", icon: FaceFrownIcon },
  { type: ReactionType.ANGRY, emoji: "🔥", icon: FireIcon },
];

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  isOwnMessage,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const { addMessageReaction, editMessage, removeMessage } = useMessages();

  const handleEdit = async () => {
    if (editContent.trim() !== message.content) {
      try {
        await editMessage(
          message.thread.householdId,
          message.threadId,
          message.id,
          { content: editContent }
        );
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to edit message:", error);
      }
    }
  };

  const handleReaction = async (type: ReactionType, emoji: string) => {
    try {
      await addMessageReaction(
        message.thread.householdId,
        message.threadId,
        message.id,
        { type, emoji }
      );
      setShowReactions(false);
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await removeMessage(
        message.thread.householdId,
        message.threadId,
        message.id
      );
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Reaction Button */}
      <div className="relative">
        <button
          className="btn-icon"
          onClick={() => setShowReactions(!showReactions)}
          aria-label="Add reaction"
        >
          <FaceSmileIcon className="h-4 w-4" />
        </button>

        {/* Reaction Picker */}
        {showReactions && (
          <div className="absolute bottom-full right-0 mb-2 p-1 bg-white dark:bg-background-dark rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 animate-scale origin-bottom-right">
            <div className="flex gap-1">
              {REACTIONS.map(({ type, emoji, icon: Icon }) => (
                <button
                  key={type}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
                  onClick={() => handleReaction(type, emoji)}
                  aria-label={`React with ${type}`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit and Delete Actions (only for own messages) */}
      {isOwnMessage && (
        <>
          <button
            className="btn-icon"
            onClick={() => setIsEditing(true)}
            aria-label="Edit message"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            className="btn-icon text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleDelete}
            aria-label="Delete message"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 bg-white dark:bg-background-dark rounded-lg shadow-xl animate-scale">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Edit Message</h3>
              <button
                className="btn-icon"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <textarea
              className="input min-h-[100px] mb-4"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleEdit}
                disabled={editContent.trim() === message.content}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageActions;
