import React from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { CreateAttachmentDTO } from "@shared/types";
import { getFileIcon } from "@/lib/utils/fileUtils";

interface AttachmentPreviewProps {
  attachment: CreateAttachmentDTO;
  onRemove: (attachment: CreateAttachmentDTO) => void;
}

export function AttachmentPreview({
  attachment,
  onRemove,
}: AttachmentPreviewProps) {
  const isImage = attachment.fileType.startsWith("image/");

  return (
    <div className="flex items-center gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded group">
      {isImage ? (
        <img
          src={attachment.url}
          alt="Preview"
          className="h-8 w-8 object-cover rounded"
        />
      ) : (
        <div className="h-8 w-8 flex items-center justify-center">
          {getFileIcon(attachment.fileType)}
        </div>
      )}

      <span className="text-sm truncate flex-1">
        {attachment.url.split("/").pop()}
      </span>

      <button
        type="button"
        onClick={() => onRemove(attachment)}
        className="text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove attachment"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
