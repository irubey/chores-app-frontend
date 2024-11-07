import { Thread } from "@shared/types";

//Purpose:Represents an individual thread with summary information such as title, last message, and unread count.
interface ThreadItemProps {
  thread: Thread;
  isSelected: boolean;
  householdName?: string;
}

const ThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  isSelected,
  householdName,
}) => {
  return (
    <div
      className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer
      ${isSelected ? "bg-neutral-100 dark:bg-neutral-800" : ""}`}
    >
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium">{thread.title}</h3>
          {householdName && (
            <span className="text-xs text-text-secondary">{householdName}</span>
          )}
        </div>
        {/* ... rest of the thread item content */}
      </div>
    </div>
  );
};

export default ThreadItem;
