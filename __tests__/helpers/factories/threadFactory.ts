import {
  Thread,
  ThreadWithDetails,
  ThreadWithMessages,
  ThreadWithParticipants,
  CreateThreadDTO,
  UpdateThreadDTO,
  InviteUsersDTO,
  ThreadUpdateEvent,
} from "@shared/types";
import { generateId } from "../utils/idGenerator";
import { createMockUser } from "./userFactory";
import {
  createMockHousehold,
  createMockHouseholdMember,
} from "./householdFactory";
import { createMockMessageWithDetails } from "./messages/messageFactory";

// Factory Options
interface CreateThreadOptions {
  withMessages?: boolean;
  messageCount?: number;
  withParticipants?: boolean;
  participantCount?: number;
  withFullDetails?: boolean;
  isDeleted?: boolean;
  overrides?: Partial<Thread>;
}

interface CreateThreadEventOptions {
  action: ThreadUpdateEvent["action"];
  includeParticipant?: boolean;
}

// Base Factories
export function createMockThread(
  options: CreateThreadOptions = {},
  overrides: Partial<Thread> = {}
): Thread {
  const { isDeleted = false } = options;

  return {
    id: generateId("thread"),
    householdId: generateId("household"),
    authorId: generateId("user"),
    title: "Test Thread",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: isDeleted ? new Date() : undefined,
    ...overrides,
  };
}

// Complex Factories
export function createMockThreadWithMessages(
  options: CreateThreadOptions = {}
): ThreadWithMessages {
  const { messageCount = 2 } = options;
  const thread = createMockThread(options);

  return {
    ...thread,
    messages: Array.from({ length: messageCount }, () =>
      createMockMessageWithDetails({ threadId: thread.id })
    ),
  };
}

export function createMockThreadWithParticipants(
  options: CreateThreadOptions = {}
): ThreadWithParticipants {
  const { participantCount = 2 } = options;
  const thread = createMockThread(options);

  return {
    ...thread,
    participants: Array.from({ length: participantCount }, () =>
      createMockHouseholdMember({}, { householdId: thread.householdId })
    ),
  };
}

export function createMockThreadWithDetails(
  options: CreateThreadOptions = {},
  overrides: Partial<ThreadWithDetails> = {}
): ThreadWithDetails {
  const {
    withMessages = false,
    messageCount = 2,
    withParticipants = false,
    participantCount = 2,
    isDeleted = false,
    overrides: threadOverrides = {},
  } = options;

  const author = createMockUser();
  const household = createMockHousehold();

  const thread = createMockThread({ isDeleted }, threadOverrides);

  return {
    ...thread,
    author,
    household,
    messages: Array.from({ length: messageCount }, () =>
      createMockMessageWithDetails({
        threadId: thread.id,
        authorId: author.id,
      })
    ),
    participants: Array.from({ length: participantCount }, () =>
      createMockHouseholdMember(
        {},
        {
          householdId: household.id,
          userId: author.id,
        }
      )
    ),
  };
}

// DTO Factories
export function createMockCreateThreadDTO(
  overrides: Partial<CreateThreadDTO> = {}
): CreateThreadDTO {
  return {
    householdId: generateId("household"),
    title: "New Test Thread",
    participants: [generateId("user")],
    initialMessage: {
      threadId: generateId("thread"),
      content: "Initial test message",
      attachments: [],
      mentions: [],
    },
    ...overrides,
  };
}

export function createMockUpdateThreadDTO(
  overrides: Partial<UpdateThreadDTO> = {}
): UpdateThreadDTO {
  return {
    title: "Updated Test Thread",
    participants: {
      add: [generateId("user")],
      remove: [],
    },
    ...overrides,
  };
}

export function createMockInviteUsersDTO(
  userCount: number = 2
): InviteUsersDTO {
  return {
    userIds: Array.from({ length: userCount }, () => generateId("user")),
  };
}

// Event Factories
export function createMockThreadEvent(
  options: CreateThreadEventOptions
): ThreadUpdateEvent {
  const { action, includeParticipant = false } = options;
  const thread = createMockThreadWithDetails();
  const participant = includeParticipant
    ? createMockHouseholdMember()
    : undefined;

  return {
    action,
    thread: action !== "DELETED" ? thread : undefined,
    threadId: action === "DELETED" ? thread.id : undefined,
    participant: includeParticipant ? participant : undefined,
  };
}

// Batch Creation
export function createMockThreads(
  count: number,
  options: CreateThreadOptions = {}
): ThreadWithDetails[] {
  return Array.from({ length: count }, (_, index) =>
    createMockThreadWithDetails({
      ...options,
      ...{
        id: generateId("thread", index),
        title: `Test Thread ${index + 1}`,
      },
    })
  );
}

// Test Scenario Helpers
export function createMockThreadCreationFlow() {
  const dto = createMockCreateThreadDTO();
  const createdThread = createMockThreadWithDetails(
    {},
    {
      householdId: dto.householdId,
      title: dto.title,
    }
  );

  return { dto, createdThread };
}

export function createMockThreadUpdateFlow() {
  const originalThread = createMockThreadWithDetails();
  const updateDTO = createMockUpdateThreadDTO();
  const updatedThread = {
    ...originalThread,
    title: updateDTO.title,
    updatedAt: new Date(),
  };

  return { originalThread, updateDTO, updatedThread };
}

export function createMockThreadInviteFlow() {
  const thread = createMockThreadWithDetails();
  const inviteDTO = createMockInviteUsersDTO();
  const updatedThread = {
    ...thread,
    participants: [
      ...thread.participants,
      ...inviteDTO.userIds.map((userId) =>
        createMockHouseholdMember(
          {},
          {
            householdId: thread.householdId,
            userId,
          }
        )
      ),
    ],
  };

  return { thread, inviteDTO, updatedThread };
}
