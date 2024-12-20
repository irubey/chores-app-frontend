import React, { useState, useRef, useEffect } from "react";
import { useMessageInteractions } from "@/hooks/threads/useMessageInteractions";
import { useUser } from "@/hooks/users/useUser";
import { logger } from "@/lib/api/logger";
import {
  ThreadWithDetails,
  HouseholdMemberWithUser,
  CreatePollDTO,
  CreateAttachmentDTO,
} from "@shared/types";
import { cn } from "@/lib/utils";
import {
  PaperAirplaneIcon,
  ChartBarIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import Textarea from "@/components/common/Textarea";
import PollCreator from "@/components/threads/Poll/PollCreator";
import { MentionDropdown } from "@/components/threads/Mention/MentionDropdown";
import { getCaretCoordinates } from "@/lib/utils/textAreaUtils";
import { AttachmentPreview } from "./Attachment/AttachmentPreview";
import {
  validateFile,
  FileValidationError,
  ALLOWED_FILE_TYPES,
} from "@/lib/utils/fileUtils";
import PollPreview from "./Poll/PollPreview";

interface MessageInputProps {
  readonly thread: Omit<ThreadWithDetails, "participants"> & {
    participants: HouseholdMemberWithUser[];
  };
}

const MAX_MESSAGE_LENGTH = 2000;

interface MessageInputState {
  content: string;
  attachments: CreateAttachmentDTO[];
  pollData?: CreatePollDTO;
  mentions: string[];
}

interface MentionState {
  isActive: boolean;
  startPosition: number;
  searchText: string;
  selectedIndex: number;
  dropdownPosition: { top: number; left: number };
}

const MessageInput: React.FC<MessageInputProps> = ({ thread }) => {
  const [state, setState] = useState<MessageInputState>({
    content: "",
    attachments: [],
    mentions: [],
  });
  const [showPollCreator, setShowPollCreator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mentionState, setMentionState] = useState<MentionState>({
    isActive: false,
    startPosition: 0,
    searchText: "",
    selectedIndex: 0,
    dropdownPosition: { top: 0, left: 0 },
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fileErrors, setFileErrors] = useState<FileValidationError[]>([]);

  const { data: userData } = useUser();
  const user = userData?.data;

  const { createMessage, isPending } = useMessageInteractions({
    householdId: thread.householdId,
    threadId: thread.id,
  });

  const canSendMessage = Boolean(
    state.content.trim() &&
      !isPending &&
      user &&
      user.activeHouseholdId === thread.householdId &&
      state.content.length <= MAX_MESSAGE_LENGTH
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendMessage) return;

    try {
      await createMessage.mutateAsync({
        threadId: thread.id,
        content: state.content.trim(),
        mentions: state.mentions,
        attachments: state.attachments,
        poll: state.pollData,
      });

      // Reset state after successful send
      setState({
        content: "",
        attachments: [],
        mentions: [],
      });
      setShowPollCreator(false);
    } catch (error) {
      // Error handling
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFileErrors([]);

    // Validate files
    const errors: FileValidationError[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setFileErrors(errors);
      return;
    }

    const attachments: CreateAttachmentDTO[] = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      fileType: file.type,
    }));

    setState((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...attachments],
    }));

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePollCreate = (data: CreatePollDTO) => {
    setState((prev) => ({
      ...prev,
      pollData: data,
    }));
    setShowPollCreator(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!mentionState.isActive) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setMentionState((prev) => ({
          ...prev,
          selectedIndex: Math.min(
            prev.selectedIndex + 1,
            getFilteredParticipants().length - 1
          ),
        }));
        break;
      case "ArrowUp":
        e.preventDefault();
        setMentionState((prev) => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, 0),
        }));
        break;
      case "Enter":
      case "Tab":
        if (mentionState.isActive) {
          e.preventDefault();
          const participant =
            getFilteredParticipants()[mentionState.selectedIndex];
          if (participant) {
            handleMentionSelect(participant);
          }
        }
        break;
      case "Escape":
        setMentionState((prev) => ({ ...prev, isActive: false }));
        break;
    }
  };

  const handleContentChange = (value: string) => {
    const lastAtSymbol = value.lastIndexOf("@");
    if (lastAtSymbol !== -1 && lastAtSymbol >= value.lastIndexOf(" ")) {
      // Get cursor position and calculate dropdown position
      const textArea = textareaRef.current;
      if (textArea) {
        const { top, left } = getCaretCoordinates(textArea, lastAtSymbol);
        setMentionState({
          isActive: true,
          startPosition: lastAtSymbol,
          searchText: value.slice(lastAtSymbol + 1),
          selectedIndex: 0,
          dropdownPosition: { top: top + 20, left },
        });
      }
    } else {
      setMentionState((prev) => ({ ...prev, isActive: false }));
    }

    setState((prev) => ({ ...prev, content: value }));
  };

  const handleMentionSelect = (participant: HouseholdMemberWithUser) => {
    const beforeMention = state.content.slice(0, mentionState.startPosition);
    const afterMention = state.content.slice(
      mentionState.startPosition + mentionState.searchText.length + 1
    );
    const newContent = `${beforeMention}@${participant.user.name} ${afterMention}`;

    setState((prev) => ({
      ...prev,
      content: newContent,
      mentions: [...prev.mentions, participant.userId],
    }));

    setMentionState((prev) => ({ ...prev, isActive: false }));
  };

  const getFilteredParticipants = () => {
    return thread.participants.filter(
      (p) =>
        p.user.name
          ?.toLowerCase()
          .includes(mentionState.searchText.toLowerCase()) ||
        p.nickname
          ?.toLowerCase()
          .includes(mentionState.searchText.toLowerCase())
    );
  };

  const handleRemoveAttachment = (attachmentToRemove: CreateAttachmentDTO) => {
    setState((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a !== attachmentToRemove),
    }));

    // Cleanup blob URL if it exists
    if (attachmentToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(attachmentToRemove.url);
    }
  };

  const handleRemovePoll = () => {
    setState((prev) => ({
      ...prev,
      pollData: undefined,
    }));
  };

  useEffect(() => {
    return () => {
      state.attachments.forEach((attachment) => {
        if (attachment.url.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.url);
        }
      });
    };
  }, [state.attachments]);

  return (
    <form onSubmit={handleSubmit} className="h-full relative">
      {fileErrors.length > 0 && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/10 rounded">
          <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
            File Upload Errors:
          </h4>
          <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
            {fileErrors.map((error, index) => (
              <li key={index}>
                {error.file.name}: {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error display */}
      {/* Poll creator modal */}
      <PollCreator
        isOpen={showPollCreator}
        onClose={() => setShowPollCreator(false)}
        onSubmit={handlePollCreate}
      />

      <div className="grid grid-cols-[auto_1fr_auto] gap-2 h-full">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowPollCreator(true)}
            className="btn-icon"
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleAttachmentClick}
            className="btn-icon group relative"
            title="Add attachment"
          >
            <PaperClipIcon className="h-5 w-5" />
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded p-2 text-xs whitespace-nowrap">
                Max size: 10MB
                <br />
                Supported: Images, PDF, Word, Text
              </div>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept={ALLOWED_FILE_TYPES.join(",")}
          />
        </div>

        <Textarea
          ref={textareaRef}
          value={state.content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... Use @ to mention someone"
          className="h-full"
          disabled={isPending}
          autoGrow={false}
          error={
            state.content.length > MAX_MESSAGE_LENGTH
              ? "Message is too long"
              : undefined
          }
          helperText={
            state.content.length > 0
              ? `${state.content.length}/${MAX_MESSAGE_LENGTH} characters`
              : undefined
          }
        />

        <div className="flex items-center">
          <button
            type="submit"
            disabled={!canSendMessage}
            className={cn(
              "btn btn-primary h-10 w-10 p-0 flex items-center justify-center",
              !canSendMessage && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Preview area for attachments and poll */}
      {(state.attachments.length > 0 || state.pollData) && (
        <div className="mt-2 space-y-2">
          {state.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-text-secondary">
                Attachments ({state.attachments.length})
              </h4>
              <div className="space-y-1">
                {state.attachments.map((attachment, index) => (
                  <AttachmentPreview
                    key={`${attachment.url}-${index}`}
                    attachment={attachment}
                    onRemove={handleRemoveAttachment}
                  />
                ))}
              </div>
            </div>
          )}
          {state.pollData && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-text-secondary">Poll</h4>
              <PollPreview poll={state.pollData} onRemove={handleRemovePoll} />
            </div>
          )}
        </div>
      )}

      {mentionState.isActive && (
        <MentionDropdown
          participants={thread.participants}
          searchText={mentionState.searchText}
          selectedIndex={mentionState.selectedIndex}
          onSelect={handleMentionSelect}
          position={mentionState.dropdownPosition}
        />
      )}
    </form>
  );
};

export default MessageInput;
