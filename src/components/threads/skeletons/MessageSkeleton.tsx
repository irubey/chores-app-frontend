// frontend/src/components/threads/skeletons/MessageSkeleton.tsx
import React from "react";

export const MessageSkeleton = () => {
  return (
    <div className="flex space-x-md p-md">
      {/* Avatar */}
      <div className="h-10 w-10 rounded-full skeleton" />

      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center space-x-sm mb-sm">
          <div className="h-4 w-24 skeleton" />
          <div className="h-3 w-16 skeleton" />
        </div>

        {/* Content */}
        <div className="space-y-sm">
          <div className="h-4 w-full skeleton" />
          <div className="h-4 w-5/6 skeleton" />
        </div>
      </div>
    </div>
  );
};

export const MessageListSkeleton = () => {
  return (
    <div className="space-y-md">
      {[...Array(5)].map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
};
