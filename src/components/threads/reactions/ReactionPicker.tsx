import React, { useRef, useEffect } from "react";
import { useMessageInteractions } from "@/hooks/threads/useMessageInteractions";
import { useUser } from "@/hooks/users/useUser";
import { logger } from "@/lib/api/logger";
import { cn } from "@/lib/utils";
import { REACTION_EMOJIS } from "./constants";
import { ReactionType } from "@shared/enums/messages";

interface ReactionPickerProps {
  readonly messageId: string;
  readonly threadId: string;
  readonly onClose: () => void;
  readonly position?: "left" | "right";
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  messageId,
  threadId,
  onClose,
  position = "right",
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const { data: userData } = useUser();
  const user = userData?.data;

  const { addReaction } = useMessageInteractions({
    householdId: user?.activeHouseholdId ?? "",
    threadId,
    messageId,
  });

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleReactionClick = async (type: ReactionType) => {
    if (!user?.activeHouseholdId) {
      logger.warn("Cannot add reaction - no active household");
      return;
    }

    try {
      addReaction({ type, emoji: REACTION_EMOJIS[type] });
      onClose();
      logger.info("Reaction added", {
        messageId,
        type,
        userId: user.id,
      });
    } catch (error) {
      logger.error("Failed to add reaction", {
        messageId,
        type,
        userId: user.id,
        error,
      });
    }
  };

  return (
    <div
      ref={pickerRef}
      className={cn(
        "absolute top-8 z-popover",
        position === "right" ? "right-0" : "left-0",
        "bg-white dark:bg-background-dark rounded-lg shadow-lg",
        "border border-neutral-200 dark:border-neutral-700",
        "p-2 grid grid-cols-3 gap-1",
        "animate-scale",
        position === "right" ? "origin-top-right" : "origin-top-left"
      )}
    >
      {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
        <button
          key={type}
          onClick={() => handleReactionClick(type as ReactionType)}
          className={cn(
            "p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded",
            "transition-colors duration-200",
            "text-lg focus:outline-none focus-ring"
          )}
          aria-label={`React with ${type.toLowerCase()}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
