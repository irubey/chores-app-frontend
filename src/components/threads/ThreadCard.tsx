import { useMemo, useState } from "react";
import { ThreadWithDetails } from "@shared/types";
import { formatDistanceToNow, format } from "date-fns";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { logger } from "@/lib/api/logger";
import { ThreadModal } from "./ThreadModal";
import { useUser } from "@/hooks/users/useUser";

interface ThreadCardProps {
  readonly thread: ThreadWithDetails;
  readonly animationDelay?: number;
}

export function ThreadCard({ thread, animationDelay = 0 }: ThreadCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: userData } = useUser();
  const user = userData?.data;

  const lastMessage = useMemo(
    () => thread.messages[thread.messages.length - 1],
    [thread.messages]
  );

  // Calculate unread count based on message read status
  const unreadCount = useMemo(() => {
    if (!thread.messages.length || !user?.id) return 0;
    return thread.messages.reduce((count, message) => {
      const isRead = message.reads?.find(
        (status) => status.userId === user.id
      )?.readAt;
      return count + (isRead ? 0 : 1);
    }, 0);
  }, [thread.messages, user?.id]);

  const timestamp = useMemo(() => {
    const date = new Date(lastMessage?.createdAt || thread.createdAt);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: format(date, "PPp"),
    };
  }, [lastMessage?.createdAt, thread.createdAt]);

  logger.debug("Rendering thread card", {
    threadId: thread.id,
    unreadCount,
  });

  return (
    <div
      className="animate-slide-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full text-left transition-transform hover:scale-[1.02] focus:outline-none focus-ring rounded-lg"
        aria-label={`Open thread: ${thread.title || "Untitled Thread"}`}
      >
        <div className="card hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-h5 line-clamp-1 mb-0">
                  {thread.title || "Untitled Thread"}
                </h3>
                {unreadCount > 0 && (
                  <span className="badge-primary animate-pulse-subtle">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary dark:text-text-secondary mb-2">
                {thread.household.name}
              </p>
            </div>
            <time
              className="text-xs text-text-secondary dark:text-text-secondary whitespace-nowrap"
              title={timestamp.absolute}
            >
              {timestamp.relative}
            </time>
          </div>

          {lastMessage && (
            <div className="mt-4">
              <p className="text-sm text-text-secondary dark:text-text-secondary line-clamp-2 mb-0">
                <span className="font-medium text-text-primary dark:text-text-secondary">
                  {lastMessage.author.name}:
                </span>{" "}
                {lastMessage.content}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center space-x-4 text-text-secondary dark:text-text-secondary">
            <div className="flex items-center space-x-1 hover:text-primary dark:hover:text-primary-light transition-colors">
              <ChatBubbleLeftIcon className="h-5 w-5" />
              <span className="text-xs font-medium">
                {thread.messages.length}
              </span>
            </div>
          </div>
        </div>
      </button>

      <ThreadModal
        thread={thread}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
