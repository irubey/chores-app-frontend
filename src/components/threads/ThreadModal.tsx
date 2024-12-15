import React from "react";
import Modal from "@/components/common/Modal";
import { MessageList } from "./MessageList";
import { ThreadWithDetails } from "@shared/types";
import { ThreadHeader } from "./ThreadHeader";
import MessageInput from "./MessageInput";

interface ThreadModalProps {
  readonly thread: ThreadWithDetails;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const ThreadModal: React.FC<ThreadModalProps> = ({
  thread,
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      maxHeight="screen"
      padding="none"
      showCloseButton={false}
      title={<ThreadHeader thread={thread} />}
      footer={
        <div className="w-full">
          <MessageInput thread={thread} />
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <MessageList thread={thread} />
      </div>
    </Modal>
  );
};
