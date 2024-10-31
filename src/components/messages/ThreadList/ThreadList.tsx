import { Thread } from "@shared/types";

//Purpose:Displays a list of all message threads, allowing users to browse and select different discussion threads.
interface ThreadListProps {
  threads: Thread[];
  selectedThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
}
