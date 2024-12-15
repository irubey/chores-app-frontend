import React, { useState } from "react";
import { useMessageInteractions } from "@/hooks/threads/useMessageInteractions";
import { useUser } from "@/hooks/users/useUser";
import { logger } from "@/lib/api/logger";
import { ThreadWithDetails, HouseholdMemberWithUser } from "@shared/types";
import { cn } from "@/lib/utils";
import {
  PaperAirplaneIcon,
  ChartBarIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import Textarea from "@/components/common/Textarea";

interface MessageInputProps {
  readonly thread: Omit<ThreadWithDetails, "participants"> & {
    participants: HouseholdMemberWithUser[];
  };
}

const MAX_MESSAGE_LENGTH = 2000;

const MessageInput: React.FC<MessageInputProps> = ({ thread }) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data: userData } = useUser();
  const user = userData?.data;

  const { createMessage, isPending } = useMessageInteractions({
    householdId: thread.householdId,
    threadId: thread.id,
  });

  const canSendMessage = Boolean(
    content.trim() &&
      !isPending &&
      user &&
      user.activeHouseholdId === thread.householdId &&
      content.length <= MAX_MESSAGE_LENGTH
  );

  const extractMentions = (text: string) => {
    const mentions = new Set<string>();
    const regex = /@([\w\s]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const username = match[1].trim();
      const member = thread.participants.find(
        (p) =>
          p.user.name?.toLowerCase() === username.toLowerCase() ||
          p.nickname?.toLowerCase() === username.toLowerCase()
      );
      if (member?.userId) {
        mentions.add(member.userId);
      }
    }

    return Array.from(mentions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSendMessage) return;

    try {
      const mentions = extractMentions(content);
      await createMessage.mutateAsync({
        threadId: thread.id,
        content: content.trim(),
        mentions,
      });
      setContent("");
      logger.info("Message sent", {
        threadId: thread.id,
        householdId: thread.householdId,
        userId: user?.id,
        hasMentions: mentions.length > 0,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message";
      setError(errorMessage);
      logger.error("Failed to send message", {
        threadId: thread.id,
        householdId: thread.householdId,
        userId: user?.id,
        error,
      });
    }
  };

  const getErrorMessage = () => {
    if (!user) return "You must be logged in to send messages";
    if (user.activeHouseholdId !== thread.householdId) {
      return "You must be in this household to send messages";
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return `Message is too long (${content.length}/${MAX_MESSAGE_LENGTH} characters)`;
    }
    return error;
  };

  const displayError = getErrorMessage();

  return (
    <form
      onSubmit={handleSubmit}
      className="h-full"
      aria-label="Message input form"
    >
      {displayError && (
        <p
          role="alert"
          className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded mb-2"
        >
          {displayError}
        </p>
      )}
      <div className="grid grid-cols-[auto_1fr_auto] gap-2 h-full">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-icon text-text-secondary hover:text-primary bg-white dark:bg-background-dark"
            title="Create poll"
            onClick={() => {
              logger.debug("Poll button clicked");
            }}
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="btn-icon text-text-secondary hover:text-primary bg-white dark:bg-background-dark"
            title="Add attachment"
            onClick={() => {
              logger.debug("Attachment button clicked");
            }}
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
        </div>

        <Textarea
          value={content}
          onChange={setContent}
          placeholder="Type your message... Use @ to mention someone"
          className="h-full"
          disabled={isPending}
          autoGrow={false}
          error={
            content.length > MAX_MESSAGE_LENGTH
              ? "Message is too long"
              : undefined
          }
          helperText={
            content.length > 0
              ? `${content.length}/${MAX_MESSAGE_LENGTH} characters`
              : undefined
          }
        />

        <div className="flex items-center">
          <button
            type="submit"
            disabled={!canSendMessage}
            className={cn(
              "btn btn-primary h-10 w-10 p-0 flex items-center justify-center",
              !canSendMessage && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
