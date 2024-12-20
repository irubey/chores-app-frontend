import { ThreadWithDetails } from "@shared/types";
import { ThreadCard } from "./ThreadCard";

interface ThreadListProps {
  threads: ThreadWithDetails[];
}

export function ThreadList({ threads }: ThreadListProps) {
  return (
    <div className="flex flex-col space-y-md">
      {threads.map((thread, index) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          animationDelay={index * 0.05}
        />
      ))}
    </div>
  );
}
