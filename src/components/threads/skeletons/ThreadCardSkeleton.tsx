// frontend/src/components/threads/skeletons/ThreadCardSkeleton.tsx
import React from "react";

interface ThreadListSkeletonProps {
  count?: number;
}

export function ThreadListSkeleton({ count = 6 }: ThreadListSkeletonProps) {
  return (
    <div className="grid-auto-fit gap-md animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <ThreadCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ThreadCardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
        </div>
        <div className="skeleton h-4 w-16" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>

      <div className="mt-4 flex items-center space-x-4">
        <div className="skeleton h-4 w-8" />
        <div className="skeleton h-4 w-8" />
        <div className="skeleton h-4 w-8" />
      </div>
    </div>
  );
}
