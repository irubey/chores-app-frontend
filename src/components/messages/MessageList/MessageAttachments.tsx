import React from "react";
import { Attachment } from "@shared/types";
import {
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useMessages } from "@/hooks/useMessages";

interface MessageAttachmentsProps {
  attachments: Attachment[];
  messageId: string;
  threadId: string;
  householdId: string;
  isOwnMessage: boolean;
}

const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  messageId,
  threadId,
  householdId,
  isOwnMessage,
}) => {
  const { removeMessageAttachment } = useMessages();

  const isImage = (fileType: string) => fileType.startsWith("image/");

  const handleRemove = async (attachmentId: string) => {
    try {
      await removeMessageAttachment(
        householdId,
        threadId,
        messageId,
        attachmentId
      );
    } catch (error) {
      console.error("Failed to remove attachment:", error);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="group relative bg-neutral-50 dark:bg-neutral-800 rounded-lg overflow-hidden"
        >
          {isImage(attachment.fileType) ? (
            // Image attachment
            <div className="relative aspect-video w-64">
              <Image
                src={attachment.url}
                alt={`Attachment ${attachment.id}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 256px"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200" />
            </div>
          ) : (
            // Document attachment
            <div className="p-3 flex items-center gap-3">
              <DocumentIcon className="h-8 w-8 text-text-secondary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {attachment.url.split("/").pop() || "Document"}
                </p>
                <p className="text-xs text-text-secondary">
                  {attachment.fileType}
                </p>
              </div>
            </div>
          )}

          {/* Download button */}
          <a
            href={attachment.url}
            download
            className="absolute top-2 right-2 p-1 rounded-full bg-white dark:bg-background-dark bg-opacity-75 dark:bg-opacity-75 
                     text-text-secondary hover:text-text-primary transition-colors duration-200
                     opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Download file"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </a>

          {/* Remove button (if own message) */}
          {isOwnMessage && (
            <button
              onClick={() => handleRemove(attachment.id)}
              className="absolute top-2 right-8 p-1 rounded-full bg-white dark:bg-background-dark bg-opacity-75 dark:bg-opacity-75 
                       text-text-secondary hover:text-red-500 transition-colors duration-200
                       opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Remove attachment"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageAttachments;
