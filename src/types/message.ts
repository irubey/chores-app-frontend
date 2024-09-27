import { CreateAttachmentDTO } from './attachment';

export interface Message {
  id: string;
  householdId: string;
  authorId: string;
  content: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  // Add other fields as necessary
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
  // Add other fields as necessary
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
  // Add other fields as necessary
}

export interface AttachmentDTO {
  url: string;
  fileType: string;
}

export interface MessageWithDetails extends Message {
  author: {
    id: string;
    name: string;
    // Add other relevant user fields
  };
  threads: Thread[];
  attachments: Attachment[];
}

export interface ThreadWithDetails extends Thread {
  author: {
    id: string;
    name: string;
    // Add other relevant user fields
  };
  attachments: Attachment[];
}
