export interface Attachment {
  id: string;
  messageId?: string;
  threadId?: string;
  url: string;
  fileType: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  // Add other fields as necessary
}

export interface CreateAttachmentDTO {
  url: string;
  fileType: string;
}