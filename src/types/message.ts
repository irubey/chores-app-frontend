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
