import { Thread } from "@shared/types";

//Purpose:Represents an individual thread with summary information such as title, last message, and unread count.
interface ThreadItemProps {
  thread: Thread;
  isSelected: boolean;
  onSelect: (threadId: string) => void;
}
