import React, { useState, useRef } from "react";
import { useMessages } from "@/hooks/useMessages";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { CreateMessageDTO, MessageWithDetails } from "@shared/types";

interface MessageInputProps {
  threadId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ threadId }) => {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedThread, sendMessage, addMessageAttachment } = useMessages();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !pendingFiles.length) || !selectedThread) return;

    try {
      const messageData: CreateMessageDTO = {
        threadId,
        content: message.trim(),
      };

      const response = await sendMessage(
        selectedThread.householdId,
        threadId,
        messageData
      );

      // Check if the action was fulfilled and has payload data
      if (response.meta.requestStatus === "fulfilled" && response.payload) {
        const newMessage = response.payload as MessageWithDetails;

        // Upload any pending files
        if (pendingFiles.length > 0 && newMessage.id) {
          setIsUploading(true);
          try {
            for (const file of pendingFiles) {
              await addMessageAttachment(
                selectedThread.householdId,
                threadId,
                newMessage.id,
                file
              );
            }
          } finally {
            setIsUploading(false);
            setPendingFiles([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        }
      }

      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setPendingFiles(Array.from(files));
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              pendingFiles.length > 0
                ? "Add a message (optional)"
                : "Type a message..."
            }
            className="input min-h-[2.5rem] max-h-32 py-2 pr-20"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {pendingFiles.length > 0 && (
            <div className="mt-2 text-xs text-text-secondary">
              {pendingFiles.length} file(s) selected
            </div>
          )}
        </div>

        {/* File Upload Buttons */}
        <div className="absolute right-14 bottom-2 flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-icon"
            disabled={isUploading}
            aria-label="Attach file"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-icon"
            disabled={isUploading}
            aria-label="Upload image"
          >
            <PhotoIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          className="btn-primary p-2"
          disabled={(!message.trim() && !pendingFiles.length) || isUploading}
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
