// frontend/src/components/threads/skeletons/PollSkeleton.tsx
import React from "react";

export const PollSkeleton = () => {
  return (
    <div className="p-md border rounded-lg">
      {/* Poll question */}
      <div className="h-5 w-3/4 skeleton mb-md" />

      {/* Options */}
      <div className="space-y-md">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-md">
            <div className="h-4 w-4 rounded-full skeleton" />
            <div className="h-4 flex-1 skeleton" />
            <div className="h-4 w-12 skeleton" />
          </div>
        ))}
      </div>

      {/* Meta */}
      <div className="mt-md flex justify-between items-center">
        <div className="h-4 w-32 skeleton" />
        <div className="h-4 w-24 skeleton" />
      </div>
    </div>
  );
};
