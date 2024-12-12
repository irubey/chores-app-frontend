import { testLogger } from "../utils/testLogger";
import {
  createMockThread,
  createMockThreadWithDetails,
  createMockThreadWithMessages,
  createMockThreadWithParticipants,
  createMockThreadCreationFlow,
  createMockThreadUpdateFlow,
  createMockThreadInviteFlow,
} from "../factories/threadFactory";
import { createMockApiCall } from "../mocks/apiMocks";
import {
  ThreadWithDetails,
  ThreadUpdateEvent,
  HouseholdMember,
} from "@shared/types";
import { generateId } from "../utils/idGenerator";

interface SetupThreadListOptions {
  count?: number;
  hasMore?: boolean;
  nextCursor?: string;
  startAfterId?: string;
  sortDirection?: "asc" | "desc";
  sortBy?: string;
}

export const setupThreadListScenario = async ({
  count = 3,
  hasMore = false,
  nextCursor,
  startAfterId,
  sortDirection = "desc",
  sortBy = "createdAt",
}: SetupThreadListOptions = {}) => {
  testLogger.debug("Setting up thread list scenario", {
    count,
    hasMore,
    nextCursor,
    startAfterId,
    sortDirection,
    sortBy,
  });

  const threads = Array.from({ length: count }, (_, i) =>
    createMockThreadWithDetails({
      overrides: {
        id: startAfterId
          ? `thread-id-${parseInt(startAfterId.split("-")[2]) + i + 1}`
          : `thread-id-${i + 1}`,
        createdAt: new Date(Date.now() - i * 1000),
      },
    })
  );

  if (sortDirection === "asc") {
    threads.reverse();
  }

  return {
    threads,
    response: await createMockApiCall(threads, {
      shouldSucceed: true,
      pagination: { hasMore, nextCursor },
    }),
  };
};

interface SetupThreadDetailsOptions {
  withMessages?: boolean;
  withParticipants?: boolean;
  messageCount?: number;
  participantCount?: number;
  threadOverrides?: Partial<ThreadWithDetails>;
}

export const setupThreadDetailsScenario = async ({
  withMessages = true,
  withParticipants = true,
  messageCount = 2,
  participantCount = 2,
  threadOverrides = {},
}: SetupThreadDetailsOptions = {}) => {
  testLogger.debug("Setting up thread details scenario", {
    withMessages,
    withParticipants,
    messageCount,
    participantCount,
  });

  const thread = createMockThreadWithDetails(
    {
      withMessages,
      withParticipants,
      messageCount,
      participantCount,
    },
    threadOverrides
  );

  return {
    thread,
    response: await createMockApiCall(thread),
  };
};

interface SetupThreadCreationOptions {
  withInitialMessage?: boolean;
  participantCount?: number;
  householdId?: string;
}

export const setupThreadCreationScenario = async ({
  withInitialMessage = true,
  participantCount = 2,
  householdId = generateId("household"),
}: SetupThreadCreationOptions = {}) => {
  testLogger.debug("Setting up thread creation scenario", {
    withInitialMessage,
    participantCount,
    householdId,
  });

  const { dto, createdThread } = createMockThreadCreationFlow();

  return {
    createDTO: {
      ...dto,
      householdId,
      participants: Array.from({ length: participantCount }, () =>
        generateId("user")
      ),
      initialMessage: withInitialMessage ? dto.initialMessage : undefined,
    },
    createdThread,
    response: await createMockApiCall(createdThread),
  };
};

interface SetupThreadUpdateOptions {
  updateTitle?: boolean;
  addParticipants?: number;
  removeParticipants?: number;
}

export const setupThreadUpdateScenario = async ({
  updateTitle = true,
  addParticipants = 1,
  removeParticipants = 0,
}: SetupThreadUpdateOptions = {}) => {
  testLogger.debug("Setting up thread update scenario", {
    updateTitle,
    addParticipants,
    removeParticipants,
  });

  const { originalThread, updateDTO, updatedThread } =
    createMockThreadUpdateFlow();

  return {
    originalThread,
    updateDTO: {
      ...updateDTO,
      title: updateTitle ? updateDTO.title : undefined,
      participants: {
        add: Array.from({ length: addParticipants }, () => generateId("user")),
        remove: Array.from({ length: removeParticipants }, () =>
          generateId("user")
        ),
      },
    },
    updatedThread,
    response: await createMockApiCall(updatedThread),
  };
};

interface SetupThreadInviteOptions {
  inviteeCount?: number;
  threadOverrides?: Partial<ThreadWithDetails>;
}

export const setupThreadInviteScenario = async ({
  inviteeCount = 2,
  threadOverrides = {},
}: SetupThreadInviteOptions = {}) => {
  testLogger.debug("Setting up thread invite scenario", {
    inviteeCount,
  });

  const { thread, inviteDTO, updatedThread } = createMockThreadInviteFlow();

  const customThread = {
    ...thread,
    ...threadOverrides,
  };

  return {
    thread: customThread,
    inviteDTO: {
      userIds: Array.from({ length: inviteeCount }, () => generateId("user")),
    },
    updatedThread: {
      ...updatedThread,
      ...threadOverrides,
    },
    response: await createMockApiCall(updatedThread),
  };
};

interface SetupThreadEventOptions {
  action: ThreadUpdateEvent["action"];
  includeParticipant?: boolean;
  threadOverrides?: Partial<ThreadWithDetails>;
  participantOverrides?: Partial<HouseholdMember>;
}

export const setupThreadEventScenario = ({
  action,
  includeParticipant = false,
  threadOverrides = {},
  participantOverrides = {},
}: SetupThreadEventOptions) => {
  testLogger.debug("Setting up thread event scenario", {
    action,
    includeParticipant,
  });

  const thread =
    action !== "DELETED"
      ? createMockThreadWithDetails({}, threadOverrides)
      : undefined;

  return {
    event: {
      action,
      thread,
      threadId: action === "DELETED" ? generateId("thread") : undefined,
      participant: includeParticipant
        ? createMockThreadWithParticipants().participants[0]
        : undefined,
    },
  };
};
