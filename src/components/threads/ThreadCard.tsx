import { ThreadWithDetails } from "@shared/types";
import { useThreads } from "@/hooks/threads/useThreads";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ThreadCardProps {
  thread: ThreadWithDetails;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const { getThreadUnreadCount } = useThreads();
  const unreadCount = getThreadUnreadCount(thread);
  const lastMessage = thread.messages[thread.messages.length - 1];

  return (
    <Link href={`/threads/${thread.id}`} className="block">
      <div className="card hover:bg-neutral-50 dark:hover:bg-neutral-800">
        <div className="flex justify-between items-start">
          {/* Header */}
          <div className="flex-1">
            <h4 className="line-clamp-1 mb-2">{thread.title}</h4>
            <p className="text-sm text-text-secondary">
              {thread.household.name}
            </p>
          </div>

          {/* Meta */}
          <div className="flex items-center space-x-sm">
            {unreadCount > 0 && (
              <span className="badge-primary">{unreadCount}</span>
            )}
            <span className="text-sm text-text-secondary">
              {formatDistanceToNow(new Date(thread.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {/* Last message preview */}
        {lastMessage && (
          <div className="mt-md">
            <p className="text-sm text-text-secondary line-clamp-2">
              {lastMessage.content}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
