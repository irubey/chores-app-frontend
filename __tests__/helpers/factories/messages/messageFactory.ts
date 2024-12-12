import {
  Message,
  MessageWithDetails,
  CreateMessageDTO,
  UpdateMessageDTO,
  ReactionWithUser,
  MentionWithUser,
  MessageReadWithUser,
  PollWithDetails,
  CreatePollDTO,
  PollVoteWithUser,
  Attachment,
  MessageUpdateEvent,
  ReactionUpdateEvent,
  AttachmentUpdateEvent,
  MentionUpdateEvent,
  PollUpdateEvent,
  MessageReadStatus,
  CreateReactionDTO,
  CreateMentionDTO,
  CreatePollVoteDTO,
  CreateAttachmentDTO,
  MessageStatus,
} from "@shared/types";
import {
  PollType,
  PollStatus,
  MessageAction,
  ReactionType,
} from "@shared/enums";
import { generateId } from "../../utils/idGenerator";
import { createMockUser } from "../userFactory";
import { createMockThread } from "../threadFactory";
import { PaginationOptions, PaginationMeta } from "@shared/interfaces";
import { createMockAttachment } from "./attachmentFactory";
import { createMockMention } from "./mentionFactory";
import { createMockPoll, CreatePollOptions } from "./pollFactory";
import { createMockReaction } from "./reactionFactory";

// Factory Options
export interface CreateMessageOptions {
  withAttachments?: boolean;
  withReactions?: boolean;
  withMentions?: boolean;
  withPoll?: boolean;
  withReadStatus?: boolean;
  attachmentCount?: number;
  reactionCount?: number;
  mentionCount?: number;
  isDeleted?: boolean;
  threadId?: string;
  authorId?: string;
}

// Base Factories
export function createMockMessage(
  options: CreateMessageOptions = {},
  overrides: Partial<Message> = {}
): Message {
  const { isDeleted = false } = options;

  return {
    id: generateId("message"),
    threadId: generateId("thread"),
    authorId: generateId("user"),
    content: "Test message content",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: isDeleted ? new Date() : undefined,
    ...overrides,
  };
}

export function createMockMessageWithDetails(
  options: CreateMessageOptions = {},
  overrides: Partial<MessageWithDetails> = {}
): MessageWithDetails {
  const {
    withAttachments = false,
    withReactions = false,
    withMentions = false,
    withPoll = false,
    withReadStatus = false,
    attachmentCount = 2,
    reactionCount = 2,
    mentionCount = 2,
  } = options;

  const author = createMockUser();
  const thread = createMockThread();
  const baseMessage = createMockMessage(options, {
    threadId: thread.id,
    authorId: author.id,
  });

  return {
    ...baseMessage,
    author,
    thread,
    attachments: withAttachments
      ? Array.from({ length: attachmentCount }, () =>
          createMockAttachment(baseMessage.id)
        )
      : [],
    reactions: withReactions
      ? Array.from({ length: reactionCount }, () =>
          createMockReaction(baseMessage.id)
        )
      : [],
    mentions: withMentions
      ? Array.from({ length: mentionCount }, () =>
          createMockMention(baseMessage.id)
        )
      : [],
    reads: withReadStatus ? [createMockReadStatus(baseMessage.id)] : [],
    poll: withPoll ? createMockPoll(baseMessage.id) : undefined,
    ...overrides,
  };
}

// Pagination Support
export interface MessagePage {
  messages: MessageWithDetails[];
  pagination: PaginationMeta;
}

export function createMockMessagePage(
  options: PaginationOptions = {},
  messageCount: number = 10
): MessagePage {
  const { limit = 10, cursor } = options;
  const hasMore = messageCount > limit;

  return {
    messages: createMockMessages(Math.min(limit, messageCount)),
    pagination: {
      hasMore,
      nextCursor: hasMore ? generateId("cursor") : undefined,
      total: messageCount,
    },
  };
}

// Test Scenario Helpers
export function createMockMessageCreationFlow() {
  const thread = createMockThread();
  const author = createMockUser();
  const createDTO = createMockMessageDTO({
    threadId: thread.id,
  });

  const createdMessage = createMockMessageWithDetails(
    {},
    {
      threadId: thread.id,
      authorId: author.id,
      content: createDTO.content,
    }
  );

  return { thread, author, createDTO, createdMessage };
}

// Additional DTO Factories
export function createMockMessageDTO(
  overrides: Partial<CreateMessageDTO> = {}
): CreateMessageDTO {
  return {
    threadId: generateId("thread"),
    content: "Test message content",
    attachments: [],
    mentions: [],
    poll: undefined,
    ...overrides,
  };
}

export function createMockReadStatus(
  messageId: string,
  overrides: Partial<MessageReadWithUser> = {}
): MessageReadWithUser {
  const user = createMockUser();
  return {
    id: generateId("read"),
    messageId,
    userId: user.id,
    readAt: new Date(),
    user,
    ...overrides,
  };
}

// Additional Test Scenarios
export function createMockMessageReadFlow() {
  const message = createMockMessageWithDetails();
  const reader = createMockUser();
  const readStatus = createMockReadStatus(message.id, {
    userId: reader.id,
    user: reader,
  });

  const updatedMessage = {
    ...message,
    reads: [...(message.reads || []), readStatus],
  };

  return { message, reader, readStatus, updatedMessage };
}

// Pagination Helpers
export function createMockMessageListWithPagination(
  options: PaginationOptions = {}
): MessagePage {
  const { limit = 10, cursor } = options;
  const totalMessages = limit + 5; // Ensure we have more messages than the limit
  const messages = createMockMessages(limit);

  return {
    messages,
    pagination: {
      hasMore: true,
      nextCursor: generateId("cursor"),
      total: totalMessages,
    },
  };
}

export function createMockMessages(
  count: number,
  options: CreateMessageOptions = {}
): MessageWithDetails[] {
  return Array.from({ length: count }, (_, index) =>
    createMockMessageWithDetails(options, {
      id: generateId("message", index),
      content: `Test message ${index + 1}`,
    })
  );
}
