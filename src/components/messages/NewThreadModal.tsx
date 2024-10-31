//Purpose:Modal for creating a new message thread, allowing users to add participants and set initial settings.

interface NewThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateThread: (threadData: {
    title: string;
    participants: string[];
  }) => void;
}
