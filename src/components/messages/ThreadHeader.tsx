//Purpose:Displays thread-specific information such as title, participants, and available actions (e.g., settings).

import { Thread } from "@shared/types";

interface ThreadHeaderProps {
  thread: Thread;
  onEditThread: () => void;
  onAddParticipants: () => void;
}
