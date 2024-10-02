import { User } from './user';

export interface Message {
  id: string;
  householdId: string;
  authorId: string;
  content: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  author: User;
  threads: Thread[];
  attachments: Attachment[];
}

export interface CreateMessageDTO {
  content: string;
  attachments?: CreateAttachmentDTO[];
}

export interface UpdateMessageDTO {
  content?: string;
  attachments?: CreateAttachmentDTO[];
}

export interface Thread {
  id: string;
  messageId: string;
  authorId: string;
  content: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  author: User;
  attachments: Attachment[];
}

export interface CreateThreadDTO {
  content: string;
}

export interface UpdateThreadDTO {
  content?: string;
}

export interface Attachment {
  id: string;
  messageId?: string;
  threadId?: string;
  url: string;
  fileType: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

export interface CreateAttachmentDTO {
  url: string;
  fileType: string;
}

export interface AttachmentDTO {
  url: string;
  fileType: string;
}

// These interfaces are now redundant as they're covered by the main interfaces
// Keeping them for backwards compatibility, but they can be removed if not used elsewhere
export interface MessageWithDetails extends Message {}
export interface ThreadWithDetails extends Thread {}
