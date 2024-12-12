import { useDispatch } from "react-redux";
import { testLogger } from "../utils/testLogger";
import { createMockUser } from "../factories/userFactory";
import { createMockHouseholdWithMembers } from "../factories/householdFactory";
import {
  createMockThreadWithDetails,
  createMockThreads,
} from "../factories/threadFactory";
import {
  createMockMessageWithDetails,
  createMockMessages,
} from "../factories/messages/messageFactory";
import type {
  User,
  Household,
  Thread,
  Message,
  LoginCredentials,
  RegisterUserDTO,
  HouseholdMember,
  CreateMessageDTO,
  UpdateMessageDTO,
  CreateThreadDTO,
  UpdateThreadDTO,
  MessageWithDetails,
  ThreadWithDetails,
  HouseholdMemberWithUser,
  CreateReactionDTO,
  CreatePollDTO,
  CreatePollVoteDTO,
} from "@shared/types";
import { PaginationOptions } from "@shared/interfaces";
import { HouseholdRole } from "@shared/enums";
import { ApiError } from "@/lib/api/errors";

// Mock hook configuration types
interface MockHookConfig {
  shouldSucceed?: boolean;
  delay?: number;
  error?: ApiError;
}

interface MockAuthHookConfig extends MockHookConfig {
  isAuthenticated?: boolean;
  user?: User | null;
  status?: "idle" | "loading" | "succeeded" | "failed";
}

interface MockHouseholdHookConfig extends MockHookConfig {
  households?: Household[];
  currentHousehold?: Household | null;
  members?: HouseholdMember[];
  selectedHouseholds?: HouseholdMemberWithUser[];
  status?: "idle" | "loading" | "succeeded" | "failed";
}

interface MockThreadHookConfig extends MockHookConfig {
  threads?: ThreadWithDetails[];
  selectedThread?: ThreadWithDetails | null;
  hasMore?: boolean;
  nextCursor?: string;
  status?: "idle" | "loading" | "succeeded" | "failed";
}

interface MockMessageHookConfig extends MockHookConfig {
  messages?: MessageWithDetails[];
  selectedMessage?: MessageWithDetails | null;
  hasMore?: boolean;
  nextCursor?: string;
  status?: "idle" | "loading" | "succeeded" | "failed";
}

// Create mock hooks
export const createMockAuthHook = (config: MockAuthHookConfig = {}) => {
  const {
    shouldSucceed = true,
    delay = 0,
    error,
    isAuthenticated = false,
    user = null,
    status = "idle",
  } = config;

  testLogger.debug("Creating mock auth hook", { isAuthenticated });

  const mockUser = user || (isAuthenticated ? createMockUser() : null);

  return () => ({
    // State
    user: mockUser,
    isAuthenticated,
    isLoading: status === "loading",
    error: error || null,
    status,

    // Actions
    loginUser: jest
      .fn()
      .mockImplementation(async (credentials: LoginCredentials) => {
        testLogger.debug("Mock loginUser called", { email: credentials.email });
        if (!shouldSucceed) throw error || new Error("Login failed");
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        return createMockUser({}, { email: credentials.email });
      }),

    registerUser: jest
      .fn()
      .mockImplementation(async (data: RegisterUserDTO) => {
        testLogger.debug("Mock registerUser called", { email: data.email });
        if (!shouldSucceed) throw error || new Error("Registration failed");
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        return createMockUser({}, { email: data.email, name: data.name });
      }),

    logoutUser: jest.fn().mockImplementation(async () => {
      testLogger.debug("Mock logoutUser called");
      if (!shouldSucceed) throw error || new Error("Logout failed");
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    }),

    initAuth: jest.fn().mockImplementation(async () => {
      testLogger.debug("Mock initAuth called");
      if (!shouldSucceed) throw error || new Error("Init auth failed");
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return mockUser;
    }),

    resetAuth: jest.fn().mockImplementation(() => {
      testLogger.debug("Mock resetAuth called");
    }),
  });
};

export const createMockHouseholdHook = (
  config: MockHouseholdHookConfig = {}
) => {
  const {
    shouldSucceed = true,
    delay = 0,
    error,
    households = [],
    currentHousehold = null,
    members = [],
    selectedHouseholds = [],
    status = "idle",
  } = config;

  testLogger.debug("Creating mock household hook");

  return () => ({
    // State
    households,
    currentHousehold,
    members,
    selectedHouseholds,
    selectedMembers: members,
    status,
    error: error || null,

    // Household Actions
    fetchHouseholds: jest.fn().mockImplementation(async () => {
      testLogger.debug("Mock fetchHouseholds called");
      if (!shouldSucceed) throw error || new Error("Fetch failed");
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return households;
    }),

    fetchHouseholdDetails: jest
      .fn()
      .mockImplementation(async (householdId: string) => {
        testLogger.debug("Mock fetchHouseholdDetails called", { householdId });
        if (!shouldSucceed) throw error || new Error("Fetch details failed");
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        return currentHousehold || createMockHouseholdWithMembers();
      }),

    createNewHousehold: jest.fn().mockImplementation(async (data) => {
      testLogger.debug("Mock createNewHousehold called", { data });
      if (!shouldSucceed) throw error || new Error("Create failed");
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return createMockHouseholdWithMembers({
        overrides: { name: data.name },
      });
    }),

    updateHouseholdDetails: jest
      .fn()
      .mockImplementation(async (householdId, data) => {
        testLogger.debug("Mock updateHouseholdDetails called", {
          householdId,
          data,
        });
        if (!shouldSucceed) throw error || new Error("Update failed");
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        return createMockHouseholdWithMembers({
          overrides: { ...data },
        });
      }),

    removeHousehold: jest.fn().mockImplementation(async (householdId) => {
      testLogger.debug("Mock removeHousehold called", { householdId });
      if (!shouldSucceed) throw error || new Error("Remove failed");
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    }),

    // Member Actions
    fetchMembers: jest.fn().mockImplementation(async (householdId) => {
      testLogger.debug("Mock fetchMembers called", { householdId });
      if (!shouldSucceed) throw error || new Error("Fetch members failed");
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return members;
    }),

    inviteMember: jest.fn().mockImplementation(async (householdId, email) => {
      testLogger.debug("Mock inviteMember called", { householdId, email });
      if (!shouldSucceed) throw error || new Error("Invite failed");
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return createMockHouseholdWithMembers().members[0];
    }),

    removeMember: jest
      .fn()
      .mockImplementation(async (householdId, memberId) => {
        testLogger.debug("Mock removeMember called", { householdId, memberId });
        if (!shouldSucceed) throw error || new Error("Remove member failed");
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        return memberId;
      }),

    updateMemberRole: jest
      .fn()
      .mockImplementation(async (householdId, memberId, role) => {
        testLogger.debug("Mock updateMemberRole called", {
          householdId,
          memberId,
          role,
        });
        if (!shouldSucceed) throw error || new Error("Update role failed");
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        return createMockHouseholdWithMembers().members[0];
      }),

    // Selection Actions
    getSelectedHouseholds: jest.fn().mockImplementation(async () => {
      testLogger.debug("Mock getSelectedHouseholds called");
      if (!shouldSucceed) throw error || new Error("Fetch selected failed");
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return selectedHouseholds;
    }),

    toggleHouseholdSelection: jest
      .fn()
      .mockImplementation(async (householdId, memberId, isSelected) => {
        testLogger.debug("Mock toggleHouseholdSelection called", {
          householdId,
          memberId,
          isSelected,
        });
        if (!shouldSucceed) throw error || new Error("Toggle selection failed");
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        return createMockHouseholdWithMembers().members[0];
      }),

    // State Management
    setCurrent: jest.fn().mockImplementation((household) => {
      testLogger.debug("Mock setCurrent called", {
        householdId: household?.id,
      });
    }),

    resetHouseholdState: jest.fn().mockImplementation(() => {
      testLogger.debug("Mock resetHouseholdState called");
    }),
  });
};

// ... previous code ...

export const createMockThreadHook = (config: MockThreadHookConfig = {}) => {
  const {
    shouldSucceed = true,
    delay = 0,
    error,
    threads = [],
    selectedThread = null,
    hasMore = false,
    nextCursor = undefined,
    status = "idle",
  } = config;

  testLogger.debug("Creating mock thread hook");

  return () => ({
    // State
    threads,
    selectedThread,
    threadStatus: status,
    threadError: error || null,
    hasMore,
    nextCursor,

    // Thread actions
    getThreads: jest
      .fn()
      .mockImplementation(
        async (householdId: string, options?: PaginationOptions) => {
          testLogger.debug("Mock getThreads called", { householdId, options });
          if (!shouldSucceed) throw error || new Error("Fetch threads failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return threads;
        }
      ),

    startNewThread: jest
      .fn()
      .mockImplementation(
        async (householdId: string, threadData: CreateThreadDTO) => {
          testLogger.debug("Mock startNewThread called", {
            householdId,
            threadData,
          });
          if (!shouldSucceed) throw error || new Error("Create thread failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockThreadWithDetails({ withMessages: true });
        }
      ),

    getThreadDetails: jest
      .fn()
      .mockImplementation(async (householdId: string, threadId: string) => {
        testLogger.debug("Mock getThreadDetails called", {
          householdId,
          threadId,
        });
        if (!shouldSucceed)
          throw error || new Error("Fetch thread details failed");
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        return (
          selectedThread || createMockThreadWithDetails({ withMessages: true })
        );
      }),

    editThread: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          threadData: UpdateThreadDTO
        ) => {
          testLogger.debug("Mock editThread called", {
            householdId,
            threadId,
            threadData,
          });
          if (!shouldSucceed) throw error || new Error("Update thread failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockThreadWithDetails({ withMessages: true });
        }
      ),

    removeThread: jest
      .fn()
      .mockImplementation(async (householdId: string, threadId: string) => {
        testLogger.debug("Mock removeThread called", { householdId, threadId });
        if (!shouldSucceed) throw error || new Error("Remove thread failed");
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      }),

    inviteUsers: jest
      .fn()
      .mockImplementation(
        async (householdId: string, threadId: string, userIds: string[]) => {
          testLogger.debug("Mock inviteUsers called", {
            householdId,
            threadId,
            userCount: userIds.length,
          });
          if (!shouldSucceed) throw error || new Error("Invite users failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockThreadWithDetails({ withParticipants: true });
        }
      ),

    selectThread: jest
      .fn()
      .mockImplementation((thread: ThreadWithDetails | null) => {
        testLogger.debug("Mock selectThread called", { threadId: thread?.id });
      }),

    reset: jest.fn().mockImplementation(() => {
      testLogger.debug("Mock reset threads called");
    }),
  });
};
// ... previous code ...

export const createMockMessageHook = (config: MockMessageHookConfig = {}) => {
  const {
    shouldSucceed = true,
    delay = 0,
    error,
    messages = [],
    selectedMessage = null,
    hasMore = false,
    nextCursor = undefined,
    status = "idle",
  } = config;

  testLogger.debug("Creating mock message hook");

  return () => ({
    // State
    messages,
    selectedMessage,
    messageStatus: status,
    messageError: error || null,
    hasMore,
    nextCursor,

    // Message actions
    getMessages: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          options?: PaginationOptions
        ) => {
          testLogger.debug("Mock getMessages called", {
            householdId,
            threadId,
            options,
          });
          if (!shouldSucceed) throw error || new Error("Fetch messages failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return messages;
        }
      ),

    sendMessage: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageData: CreateMessageDTO
        ) => {
          testLogger.debug("Mock sendMessage called", {
            householdId,
            threadId,
            messageData,
          });
          if (!shouldSucceed) throw error || new Error("Send message failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockMessageWithDetails();
        }
      ),

    editMessage: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageId: string,
          messageData: UpdateMessageDTO
        ) => {
          testLogger.debug("Mock editMessage called", {
            householdId,
            threadId,
            messageId,
            messageData,
          });
          if (!shouldSucceed) throw error || new Error("Edit message failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockMessageWithDetails();
        }
      ),

    removeMessage: jest
      .fn()
      .mockImplementation(
        async (householdId: string, threadId: string, messageId: string) => {
          testLogger.debug("Mock removeMessage called", {
            householdId,
            threadId,
            messageId,
          });
          if (!shouldSucceed) throw error || new Error("Remove message failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        }
      ),

    // Reaction actions
    addReaction: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageId: string,
          reaction: CreateReactionDTO
        ) => {
          testLogger.debug("Mock addReaction called", {
            householdId,
            threadId,
            messageId,
            reaction,
          });
          if (!shouldSucceed) throw error || new Error("Add reaction failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockMessageWithDetails({ withReactions: true });
        }
      ),

    removeReaction: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageId: string,
          reactionId: string
        ) => {
          testLogger.debug("Mock removeReaction called", {
            householdId,
            threadId,
            messageId,
            reactionId,
          });
          if (!shouldSucceed)
            throw error || new Error("Remove reaction failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        }
      ),

    // Poll actions
    createPoll: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageId: string,
          pollData: CreatePollDTO
        ) => {
          testLogger.debug("Mock createPoll called", {
            householdId,
            threadId,
            messageId,
            pollData,
          });
          if (!shouldSucceed) throw error || new Error("Create poll failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockMessageWithDetails({ withPoll: true });
        }
      ),

    votePoll: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageId: string,
          pollId: string,
          vote: CreatePollVoteDTO
        ) => {
          testLogger.debug("Mock votePoll called", {
            householdId,
            threadId,
            messageId,
            pollId,
            vote,
          });
          if (!shouldSucceed) throw error || new Error("Vote poll failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockMessageWithDetails({ withPoll: true });
        }
      ),

    // Attachment actions
    addAttachment: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageId: string,
          file: File
        ) => {
          testLogger.debug("Mock addAttachment called", {
            householdId,
            threadId,
            messageId,
            fileName: file.name,
          });
          if (!shouldSucceed) throw error || new Error("Add attachment failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockMessageWithDetails({ withAttachments: true });
        }
      ),

    deleteAttachment: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageId: string,
          attachmentId: string
        ) => {
          testLogger.debug("Mock deleteAttachment called", {
            householdId,
            threadId,
            messageId,
            attachmentId,
          });
          if (!shouldSucceed)
            throw error || new Error("Delete attachment failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        }
      ),

    // Read status actions
    markAsRead: jest
      .fn()
      .mockImplementation(
        async (householdId: string, threadId: string, messageId: string) => {
          testLogger.debug("Mock markAsRead called", {
            householdId,
            threadId,
            messageId,
          });
          if (!shouldSucceed) throw error || new Error("Mark as read failed");
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          return createMockMessageWithDetails();
        }
      ),

    // Reset action
    reset: jest.fn().mockImplementation(() => {
      testLogger.debug("Mock reset messages called");
    }),
  });
};

// Helper to reset all mocks
export const resetHookMocks = () => {
  jest.clearAllMocks();
};
