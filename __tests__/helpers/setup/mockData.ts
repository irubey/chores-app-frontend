import { RootState } from "@/store/store";
import { createMockUser, createMockUsers } from "../factories/userFactory";
import {
  createMockHouseholdWithMembers,
  createMockHouseholds,
} from "../factories/householdFactory";
import {
  createMockThreadWithDetails,
  createMockThreads,
} from "../factories/threadFactory";
import {
  createMockMessageWithDetails,
  createMockMessages,
} from "../factories/messages/messageFactory";

// Individual State Factories
export function getMockAuthState() {
  const user = createMockUser({ isAuthenticated: true });
  return {
    user,
    status: "idle",
    error: null,
    isAuthenticated: true,
  };
}

export function getMockHouseholdState() {
  const userHouseholds = createMockHouseholds(2);
  const selectedHouseholds = [userHouseholds[0]];
  const currentHousehold = createMockHouseholdWithMembers();

  return {
    userHouseholds,
    selectedHouseholds,
    selectedMembers: currentHousehold.members || [],
    currentHousehold,
    members: currentHousehold.members || [],
    status: {
      list: "idle",
      create: "idle",
      update: "idle",
      delete: "idle",
      member: "idle",
      invitation: "idle",
    },
    error: null,
  };
}

export function getMockThreadState() {
  const threads = createMockThreads(3);
  const selectedThread = threads[0];

  return {
    threads,
    selectedThread,
    hasMore: false,
    nextCursor: undefined,
    status: {
      list: "idle",
      create: "idle",
      update: "idle",
      delete: "idle",
      invite: "idle",
      details: "idle",
    },
    error: null,
  };
}

export function getMockMessageState() {
  const messages = createMockMessages(5);
  const selectedMessage = messages[0];

  return {
    messages,
    selectedMessage,
    status: {
      list: "idle",
      create: "idle",
      update: "idle",
      delete: "idle",
      reaction: "idle",
      attachment: "idle",
      poll: "idle",
      mention: "idle",
      read: "idle",
    },
    error: null,
    hasMore: false,
    nextCursor: undefined,
  };
}

// Root State Factory
export function getMockState(): RootState {
  return {
    auth: getMockAuthState(),
    household: getMockHouseholdState(),
    threads: getMockThreadState(),
    messages: getMockMessageState(),
    finances: {
      // ... finances initial state
    },
    chores: {
      // ... chores initial state
    },
    calendar: {
      // ... calendar initial state
    },
    notifications: {
      // ... notifications initial state
    },
  } as RootState;
}

// Test Scenario Helpers
export function getMockStateWithAuthenticatedUser(): RootState {
  return {
    ...getMockState(),
    auth: {
      ...getMockAuthState(),
      user: createMockUser({ isAuthenticated: true }),
      isAuthenticated: true,
    },
  } as RootState;
}

export function getMockStateWithSelectedHousehold(): RootState {
  const household = createMockHouseholdWithMembers();
  return {
    ...getMockState(),
    household: {
      ...getMockHouseholdState(),
      currentHousehold: household,
      selectedHouseholds: [household],
    },
  } as RootState;
}
