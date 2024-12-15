import { ThreadWithDetails } from "@shared/types";

interface ThreadHeaderProps {
  thread: ThreadWithDetails;
}

export function ThreadHeader({ thread }: ThreadHeaderProps) {
  return (
    <header className="sticky top-0 bg-white dark:bg-background-dark border-b border-neutral-200 dark:border-neutral-700 z-sticky">
      <div className="container-custom py-md">
        <div>
          <h2 className="mb-2xs">{thread.title}</h2>
          <p className="text-sm text-text-secondary">{thread.household.name}</p>
        </div>
      </div>
    </header>
  );
}
