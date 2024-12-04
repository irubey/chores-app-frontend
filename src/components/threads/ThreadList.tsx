import { ThreadWithDetails } from "@shared/types";
import { ThreadCard } from "./ThreadCard";

interface ThreadListProps {
  threads: ThreadWithDetails[];
}

export function ThreadList({ threads }: ThreadListProps) {
  if (!threads.length) {
    return (
      <div className="text-center py-xl">
        <h3 className="text-text-secondary">No threads found</h3>
        <p className="text-text-secondary">
          Start a new thread to begin a conversation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-md animate-fade-in">
      {threads.map((thread) => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
    </div>
  );
}
