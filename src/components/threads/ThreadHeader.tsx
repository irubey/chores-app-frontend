import { ThreadWithDetails } from "@shared/types";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface ThreadHeaderProps {
  thread: ThreadWithDetails;
}

export function ThreadHeader({ thread }: ThreadHeaderProps) {
  return (
    <header className="sticky top-0 bg-white dark:bg-background-dark border-b border-neutral-200 dark:border-neutral-700 z-sticky">
      <div className="container-custom py-md">
        <div className="flex items-center space-x-md">
          <Link
            href="/threads"
            className="btn-icon text-text-secondary"
            aria-label="Back to threads"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="mb-2xs">{thread.title}</h2>
            <p className="text-sm text-text-secondary">
              {thread.household.name}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
