import { useMemo } from "react";
import { ThreadWithDetails } from "@shared/types";
import { formatDistanceToNow } from "date-fns";
import {
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { logger } from "@/lib/api/logger";
import Link from "next/link";

interface ThreadCardProps {
  thread: ThreadWithDetails;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const lastMessage = useMemo(
    () => thread.messages[thread.messages.length - 1],
    [thread.messages]
  );

  // Calculate unread count based on message read status
  const unreadCount = useMemo(() => {
    if (!thread.messages.length) return 0;
    return thread.messages.reduce((count, message) => {
      const isRead = message.reads?.find(
        (status) => status.userId === thread.authorId
      )?.readAt;
      return count + (isRead ? 0 : 1);
    }, 0);
  }, [thread.messages, thread.authorId]);

  const hasPoll = useMemo(
    () => thread.messages.some((m) => m.poll),
    [thread.messages]
  );

  const hasAttachments = useMemo(
    () => thread.messages.some((m) => m.attachments?.length),
    [thread.messages]
  );

  logger.debug("Rendering thread card", {
    threadId: thread.id,
    unreadCount,
    hasPoll,
    hasAttachments,
  });

  return (
    <Link
      href={`/threads/${thread.id}`}
      className="block transition-transform hover:scale-[1.02] focus:outline-none focus-ring rounded-lg"
    >
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-h5 line-clamp-1">
                {thread.title || "Untitled Thread"}
              </h3>
              {unreadCount > 0 && (
                <span className="badge-primary">{unreadCount}</span>
              )}
            </div>
            <p className="text-sm text-text-secondary mb-2">
              {thread.household.name}
            </p>
          </div>
          <time className="text-xs text-text-secondary whitespace-nowrap">
            {formatDistanceToNow(
              new Date(lastMessage?.createdAt || thread.createdAt),
              { addSuffix: true }
            )}
          </time>
        </div>

        {lastMessage && (
          <div className="mt-4">
            <p className="text-sm text-text-secondary line-clamp-2">
              <span className="font-medium text-text-primary">
                {lastMessage.author.name}:
              </span>{" "}
              {lastMessage.content}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center space-x-4 text-text-secondary">
          <div className="flex items-center space-x-1">
            <ChatBubbleLeftIcon className="h-4 w-4" />
            <span className="text-xs">{thread.messages.length}</span>
          </div>
          {hasAttachments && (
            <div className="flex items-center space-x-1">
              <PaperClipIcon className="h-4 w-4" />
            </div>
          )}
          {hasPoll && (
            <div className="flex items-center space-x-1">
              <ChartBarIcon className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
