import React from "react";
import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export const ALLOWED_FILE_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Text
  "text/plain",
  "text/csv",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationError {
  file: File;
  error: string;
}

export function validateFile(file: File): FileValidationError | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
    return {
      file,
      error: "File type not supported",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      file,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  return null;
}

export function getFileIcon(fileType: string): React.ReactNode {
  if (fileType.startsWith("image/")) {
    return React.createElement(PhotoIcon, { className: "h-5 w-5" });
  }
  if (fileType.startsWith("video/")) {
    return React.createElement(VideoCameraIcon, { className: "h-5 w-5" });
  }
  if (fileType.startsWith("audio/")) {
    return React.createElement(MusicalNoteIcon, { className: "h-5 w-5" });
  }
  if (fileType === "application/pdf") {
    return React.createElement(DocumentTextIcon, { className: "h-5 w-5" });
  }
  return React.createElement(DocumentIcon, { className: "h-5 w-5" });
}
