import React from "react";
import { ReactionWithUser } from "@shared/types";
import { useMessages } from "@/hooks/useMessages";

interface MessageReactionsProps {
  reactions: ReactionWithUser[];
  messageId: string;
  threadId: string;
  householdId: string;
  currentUserId?: string;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  messageId,
  threadId,
  householdId,
  currentUserId,
}) => {
  const { removeMessageReaction } = useMessages();

  // Group reactions by type and emoji
  const groupedReactions = reactions.reduce<
    Record<string, { emoji: string; users: ReactionWithUser[] }>
  >((acc, reaction) => {
    const key = `${reaction.type}_${reaction.emoji}`;
    if (!acc[key]) {
      acc[key] = { emoji: reaction.emoji, users: [] };
    }
    acc[key].users.push(reaction);
    return acc;
  }, {});

  const handleRemoveReaction = async (reactionId: string) => {
    try {
      await removeMessageReaction(householdId, threadId, messageId, reactionId);
    } catch (error) {
      console.error("Failed to remove reaction:", error);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {Object.entries(groupedReactions).map(([key, { emoji, users }]) => {
        const userReaction = users.find((r) => r.userId === currentUserId);
        const userNames = users.map((r) => r.user.name).join(", ");

        return (
          <button
            key={key}
            onClick={() =>
              userReaction && handleRemoveReaction(userReaction.id)
            }
            className={`group inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm 
              transition-all duration-200 hover:scale-110
              ${
                userReaction
                  ? "bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light"
                  : "bg-neutral-100 dark:bg-neutral-800 text-text-secondary"
              }`}
            title={`${userNames} reacted with ${emoji}`}
            aria-label={`${users.length} reactions with ${emoji}`}
          >
            <span className="text-base leading-none">{emoji}</span>
            <span
              className={`text-xs ${
                userReaction
                  ? "text-primary-dark dark:text-primary-light"
                  : "text-text-secondary"
              }`}
            >
              {users.length}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactions;
