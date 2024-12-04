// frontend/src/components/threads/skeletons/ThreadCardSkeleton.tsx
import React from "react";

export const ThreadCardSkeleton = () => {
  return (
    <div className="card">
      <div className="flex justify-between items-start p-md">
        {/* Header */}
        <div className="flex-1">
          <div className="h-6 w-3/4 skeleton mb-sm" />
          <div className="h-4 w-1/4 skeleton" />
        </div>
        {/* Meta */}
        <div className="h-5 w-16 skeleton" />
      </div>

      {/* Last message preview */}
      <div className="px-md pb-md">
        <div className="h-4 w-full skeleton mb-sm" />
        <div className="h-4 w-2/3 skeleton" />
      </div>
    </div>
  );
};

export const ThreadListSkeleton = () => {
  return (
    <div className="space-y-md">
      {[...Array(3)].map((_, i) => (
        <ThreadCardSkeleton key={i} />
      ))}
    </div>
  );
};
