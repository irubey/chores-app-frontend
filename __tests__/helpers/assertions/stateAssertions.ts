import { RootState } from "@/store/store";
import { testLogger } from "../utils/testLogger";
import {
  MessageWithDetails,
  ThreadWithDetails,
  User,
  HouseholdMember,
  HouseholdMemberWithUser,
  Household,
  PollWithDetails,
} from "@shared/types";
import {
  MessageAction,
  ThreadAction,
  PollStatus,
  ReactionType,
  HouseholdRole,
} from "@shared/enums";

// Types
type SliceStatus = "idle" | "loading" | "succeeded" | "failed";
type SliceName = "auth" | "threads" | "messages" | "household";

// Generic State Assertions
export function assertSliceStatus(
  state: RootState,
  slice: SliceName,
  action: string,
  expectedStatus: SliceStatus
) {
  expect(
    state[slice].status[action as keyof (typeof state)[typeof slice]["status"]]
  ).toBe(expectedStatus);
  testLogger.assertLogged("debug", `${slice} ${action} ${expectedStatus}`);
}

// Auth State Assertions
export function assertAuthState(
  state: RootState,
  config: {
    isAuthenticated: boolean;
    user: User | null;
    status: SliceStatus;
    error?: string | null;
  }
) {
  expect(state.auth.isAuthenticated).toBe(config.isAuthenticated);
  expect(state.auth.user).toEqual(config.user);
  expect(state.auth.status).toBe(config.status);
  if (config.error !== undefined) {
    expect(state.auth.error).toBe(config.error);
  }
  testLogger.assertLogged("debug", "Auth state assertion");
}

// Message State Assertions
export function assertMessageState(
  state: RootState,
  action: MessageAction,
  config: {
    status: SliceStatus;
    error?: string | null;
    messages?: MessageWithDetails[];
    selectedMessage?: MessageWithDetails | null;
  }
) {
  assertSliceStatus(state, "messages", action, config.status);

  if (config.error !== undefined) {
    expect(state.messages.error).toBe(config.error);
  }

  if (config.messages) {
    expect(state.messages.messages).toEqual(config.messages);
  }

  if (config.selectedMessage !== undefined) {
    expect(state.messages.selectedMessage).toEqual(config.selectedMessage);
  }
}

// Thread State Assertions
export function assertThreadState(
  state: RootState,
  action: ThreadAction,
  config: {
    status: SliceStatus;
    error?: string | null;
    threads?: ThreadWithDetails[];
    selectedThread?: ThreadWithDetails | null;
  }
) {
  assertSliceStatus(state, "threads", action, config.status);

  if (config.error !== undefined) {
    expect(state.threads.error).toBe(config.error);
  }

  if (config.threads) {
    expect(state.threads.threads).toEqual(config.threads);
  }

  if (config.selectedThread !== undefined) {
    expect(state.threads.selectedThread).toEqual(config.selectedThread);
  }
}

// Household State Assertions
export function assertHouseholdState(
  state: RootState,
  config: {
    userHouseholds?: Household[];
    selectedHouseholds?: Household[];
    currentHousehold?: Household | null;
    members?: HouseholdMember[];
    status: {
      list?: SliceStatus;
      create?: SliceStatus;
      update?: SliceStatus;
      delete?: SliceStatus;
      member?: SliceStatus;
      invitation?: SliceStatus;
    };
    error?: string | null;
  }
) {
  if (config.userHouseholds) {
    expect(state.household.userHouseholds).toEqual(config.userHouseholds);
  }

  if (config.selectedHouseholds) {
    expect(state.household.selectedHouseholds).toEqual(
      config.selectedHouseholds
    );
  }

  if (config.currentHousehold !== undefined) {
    expect(state.household.currentHousehold).toEqual(config.currentHousehold);
  }

  if (config.members) {
    expect(state.household.members).toEqual(config.members);
  }

  Object.entries(config.status).forEach(([key, value]) => {
    if (value) {
      expect(
        state.household.status[key as keyof typeof state.household.status]
      ).toBe(value);
    }
  });

  if (config.error !== undefined) {
    expect(state.household.error).toBe(config.error);
  }
}

// Feature-Specific Assertions
export function assertMessageFeatures(
  message: MessageWithDetails,
  config: {
    hasAttachments?: boolean;
    hasReactions?: boolean;
    hasMentions?: boolean;
    hasPoll?: boolean;
    isRead?: boolean;
  }
) {
  if (config.hasAttachments !== undefined) {
    expect(!!message.attachments?.length).toBe(config.hasAttachments);
  }

  if (config.hasReactions !== undefined) {
    expect(!!message.reactions?.length).toBe(config.hasReactions);
  }

  if (config.hasMentions !== undefined) {
    expect(!!message.mentions?.length).toBe(config.hasMentions);
  }

  if (config.hasPoll !== undefined) {
    expect(!!message.poll).toBe(config.hasPoll);
  }

  if (config.isRead !== undefined) {
    expect(!!message.reads?.length).toBe(config.isRead);
  }
}

export function assertPollState(
  poll: PollWithDetails,
  config: {
    hasVotes?: boolean;
    isOpen?: boolean;
    hasSelectedOption?: boolean;
  }
) {
  if (config.hasVotes !== undefined) {
    const hasVotes = poll.options.some((option) => option.votes.length > 0);
    expect(hasVotes).toBe(config.hasVotes);
  }

  if (config.isOpen !== undefined) {
    expect(poll.status === "OPEN").toBe(config.isOpen);
  }

  if (config.hasSelectedOption !== undefined) {
    expect(!!poll.selectedOptionId).toBe(config.hasSelectedOption);
  }
}

// Pagination Assertions
export function assertPaginationState(
  state: RootState,
  slice: "messages" | "threads",
  config: {
    hasMore: boolean;
    nextCursor?: string;
  }
) {
  expect(state[slice].hasMore).toBe(config.hasMore);
  if (config.nextCursor) {
    expect(state[slice].nextCursor).toBe(config.nextCursor);
  } else {
    expect(state[slice].nextCursor).toBeUndefined();
  }
}

// Initial State Assertions
export function assertInitialState(state: RootState, slice: SliceName) {
  expect(state[slice].error).toBeNull();

  // Check all status fields are idle
  Object.values(state[slice].status).forEach((status) => {
    expect(status).toBe("idle");
  });

  // Slice-specific initial state checks
  switch (slice) {
    case "auth":
      expect(state.auth.user).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
      break;
    case "messages":
      expect(state.messages.messages).toEqual([]);
      expect(state.messages.selectedMessage).toBeNull();
      break;
    case "threads":
      expect(state.threads.threads).toEqual([]);
      expect(state.threads.selectedThread).toBeNull();
      break;
    case "household":
      expect(state.household.userHouseholds).toEqual([]);
      expect(state.household.currentHousehold).toBeNull();
      expect(state.household.members).toEqual([]);
      break;
  }

  testLogger.assertLogged("debug", `Asserting initial ${slice} state`);
}

// Enhanced Auth State Assertions
export function assertAuthStateTransition(
  state: RootState,
  action: "login" | "register" | "logout" | "initialize",
  config: {
    beforeStatus: SliceStatus;
    afterStatus: SliceStatus;
    expectedUser?: User | null;
    expectedError?: string | null;
  }
) {
  expect(state.auth.status).toBe(config.afterStatus);
  if (config.expectedUser !== undefined) {
    expect(state.auth.user).toEqual(config.expectedUser);
    expect(state.auth.isAuthenticated).toBe(!!config.expectedUser);
  }
  if (config.expectedError !== undefined) {
    expect(state.auth.error).toBe(config.expectedError);
  }
  testLogger.assertLogged("debug", `Auth ${action} transition`);
}

// Enhanced Household Member Management
export function assertHouseholdMemberState(
  state: RootState,
  config: {
    memberId: string;
    expectedRole?: HouseholdRole;
    expectedInviteStatus?: {
      isInvited: boolean;
      isAccepted: boolean;
      isRejected: boolean;
    };
    expectedSelectionStatus?: boolean;
  }
) {
  const member = state.household.members.find((m) => m.id === config.memberId);
  expect(member).toBeDefined();
  if (member) {
    if (config.expectedRole) {
      expect(member.role).toBe(config.expectedRole);
    }
    if (config.expectedInviteStatus) {
      expect(member.isInvited).toBe(config.expectedInviteStatus.isInvited);
      expect(member.isAccepted).toBe(config.expectedInviteStatus.isAccepted);
      expect(member.isRejected).toBe(config.expectedInviteStatus.isRejected);
    }
    if (config.expectedSelectionStatus !== undefined) {
      expect(member.isSelected).toBe(config.expectedSelectionStatus);
    }
  }
}

// Enhanced Message Feature States
export function assertMessageFeatureState(
  state: RootState,
  messageId: string,
  config: {
    reactions?: {
      count: number;
      types?: ReactionType[];
    };
    poll?: {
      status: PollStatus;
      voteCount: number;
      selectedOptionId?: string;
    };
    attachments?: {
      count: number;
      types?: string[];
    };
    mentions?: {
      count: number;
      userIds?: string[];
    };
    reads?: {
      count: number;
      userIds?: string[];
    };
  }
) {
  const message = state.messages.messages.find((m) => m.id === messageId);
  expect(message).toBeDefined();
  if (message) {
    if (config.reactions) {
      expect(message.reactions?.length).toBe(config.reactions.count);
      if (config.reactions.types) {
        const reactionTypes = message.reactions?.map((r) => r.type);
        expect(reactionTypes).toEqual(
          expect.arrayContaining(config.reactions.types)
        );
      }
    }

    if (config.poll) {
      expect(message.poll?.status).toBe(config.poll.status);
      const totalVotes =
        message.poll?.options.reduce((sum, opt) => sum + opt.votes.length, 0) ??
        0;
      expect(totalVotes).toBe(config.poll.voteCount);
      if (config.poll.selectedOptionId) {
        expect(message.poll?.selectedOptionId).toBe(
          config.poll.selectedOptionId
        );
      }
    }

    if (config.attachments) {
      expect(message.attachments?.length).toBe(config.attachments.count);
      if (config.attachments.types) {
        const attachmentTypes = message.attachments?.map((a) => a.fileType);
        expect(attachmentTypes).toEqual(
          expect.arrayContaining(config.attachments.types)
        );
      }
    }

    if (config.mentions) {
      expect(message.mentions?.length).toBe(config.mentions.count);
      if (config.mentions.userIds) {
        const mentionedUserIds = message.mentions?.map((m) => m.userId);
        expect(mentionedUserIds).toEqual(
          expect.arrayContaining(config.mentions.userIds)
        );
      }
    }

    if (config.reads) {
      expect(message.reads?.length).toBe(config.reads.count);
      if (config.reads.userIds) {
        const readByUserIds = message.reads?.map((r) => r.userId);
        expect(readByUserIds).toEqual(
          expect.arrayContaining(config.reads.userIds)
        );
      }
    }
  }
}

// Enhanced Thread Participant Management
export function assertThreadParticipantState(
  state: RootState,
  threadId: string,
  config: {
    participantCount: number;
    expectedParticipants?: string[];
    pendingInvites?: string[];
    roles?: Record<string, HouseholdRole>;
  }
) {
  const thread = state.threads.threads.find((t) => t.id === threadId);
  expect(thread).toBeDefined();
  if (thread) {
    expect(thread.participants.length).toBe(config.participantCount);

    if (config.expectedParticipants) {
      const participantIds = thread.participants.map((p) => p.userId);
      expect(participantIds).toEqual(
        expect.arrayContaining(config.expectedParticipants)
      );
    }

    if (config.roles) {
      Object.entries(config.roles).forEach(([userId, expectedRole]) => {
        const participant = thread.participants.find(
          (p) => p.userId === userId
        );
        expect(participant?.role).toBe(expectedRole);
      });
    }

    if (config.pendingInvites) {
      const pendingParticipants = thread.participants.filter(
        (p) => p.isInvited && !p.isAccepted && !p.isRejected
      );
      const pendingIds = pendingParticipants.map((p) => p.userId);
      expect(pendingIds).toEqual(expect.arrayContaining(config.pendingInvites));
    }
  }
}

// Add new comprehensive state transition assertions
export function assertStateTransition(
  beforeState: RootState,
  afterState: RootState,
  slice: SliceName,
  action: string,
  config: {
    expectedStatus: SliceStatus;
    expectedError?: string | null;
    customAssertions?: (before: RootState, after: RootState) => void;
  }
) {
  // Assert status change
  assertSliceStatus(afterState, slice, action, config.expectedStatus);

  // Assert error state
  if (config.expectedError !== undefined) {
    expect(afterState[slice].error).toBe(config.expectedError);
  }

  // Run any custom assertions
  if (config.customAssertions) {
    config.customAssertions(beforeState, afterState);
  }

  testLogger.assertLogged("debug", `${slice} state transition: ${action}`);
}

// Auth State Flow Assertions
export function assertAuthStateFlow(
  state: RootState,
  flow: "login" | "register" | "logout" | "initialize",
  stages: {
    initial?: { status: SliceStatus; error?: string | null };
    loading?: { status: SliceStatus };
    success?: { status: SliceStatus; user: User };
    error?: { status: SliceStatus; error: string };
  }
) {
  // Initial stage
  if (stages.initial) {
    expect(state.auth.status).toBe(stages.initial.status);
    if (stages.initial.error !== undefined) {
      expect(state.auth.error).toBe(stages.initial.error);
    }
  }

  // Loading stage
  if (stages.loading) {
    expect(state.auth.status).toBe(stages.loading.status);
    expect(state.auth.error).toBeNull();
  }

  // Success stage
  if (stages.success) {
    expect(state.auth.status).toBe(stages.success.status);
    expect(state.auth.user).toEqual(stages.success.user);
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.error).toBeNull();
  }

  // Error stage
  if (stages.error) {
    expect(state.auth.status).toBe(stages.error.status);
    expect(state.auth.error).toBe(stages.error.error);
    expect(state.auth.isAuthenticated).toBe(false);
    if (flow === "logout" || flow === "initialize") {
      expect(state.auth.user).toBeNull();
    }
  }

  testLogger.assertLogged("debug", `Auth ${flow} flow assertion`);
}

// Household Selection State Assertions
export function assertHouseholdSelectionState(
  state: RootState,
  config: {
    selectedHouseholdIds: string[];
    currentHouseholdId?: string;
    selectionInProgress?: boolean;
    expectedError?: string | null;
    memberSelections?: Array<{
      memberId: string;
      isSelected: boolean;
      householdId: string;
    }>;
  }
) {
  // Verify selected households
  const selectedIds = state.household.selectedHouseholds.map((h) => h.id);
  expect(selectedIds).toEqual(
    expect.arrayContaining(config.selectedHouseholdIds)
  );

  // Verify current household
  if (config.currentHouseholdId !== undefined) {
    expect(state.household.currentHousehold?.id).toBe(
      config.currentHouseholdId
    );
  }

  // Verify member selections
  if (config.memberSelections) {
    config.memberSelections.forEach((selection) => {
      const member = state.household.members.find(
        (m) => m.id === selection.memberId
      );
      expect(member).toBeDefined();
      expect(member?.isSelected).toBe(selection.isSelected);
      expect(member?.householdId).toBe(selection.householdId);
    });
  }

  // Verify error state
  if (config.expectedError !== undefined) {
    expect(state.household.error).toBe(config.expectedError);
  }

  testLogger.assertLogged("debug", "Household selection state assertion");
}

// Thread State Flow Assertions
export function assertThreadStateFlow(
  state: RootState,
  threadId: string,
  flow: "create" | "update" | "delete" | "invite",
  stages: {
    before?: ThreadWithDetails;
    during?: {
      status: SliceStatus;
      error?: string | null;
      partialThread?: Partial<ThreadWithDetails>;
    };
    after?: {
      status: SliceStatus;
      thread: ThreadWithDetails | null;
      error?: string | null;
    };
  }
) {
  // Before stage
  if (stages.before) {
    const thread = state.threads.threads.find((t) => t.id === threadId);
    expect(thread).toEqual(stages.before);
  }

  // During stage
  if (stages.during) {
    expect(state.threads.status[flow]).toBe(stages.during.status);
    if (stages.during.error !== undefined) {
      expect(state.threads.error).toBe(stages.during.error);
    }
    if (stages.during.partialThread) {
      const thread = state.threads.threads.find((t) => t.id === threadId);
      expect(thread).toMatchObject(stages.during.partialThread);
    }
  }

  // After stage
  if (stages.after) {
    expect(state.threads.status[flow]).toBe(stages.after.status);
    if (flow === "delete") {
      expect(
        state.threads.threads.find((t) => t.id === threadId)
      ).toBeUndefined();
    } else if (stages.after.thread) {
      const thread = state.threads.threads.find((t) => t.id === threadId);
      expect(thread).toEqual(stages.after.thread);
    }
    if (stages.after.error !== undefined) {
      expect(state.threads.error).toBe(stages.after.error);
    }
  }

  testLogger.assertLogged("debug", `Thread ${flow} flow assertion`);
}

// Message State Transitions
export function assertMessageStateTransitions(
  state: RootState,
  messageId: string,
  feature: "reaction" | "poll" | "attachment" | "mention" | "read",
  transitions: {
    before: MessageWithDetails;
    action: {
      type: string;
      payload?: any;
    };
    after: {
      status: SliceStatus;
      expectedMessage: MessageWithDetails;
      error?: string | null;
    };
    featureSpecific?: {
      reactionCount?: number;
      pollVotes?: number;
      attachmentCount?: number;
      mentionCount?: number;
      readCount?: number;
    };
  }
) {
  // Before state
  const beforeMessage = state.messages.messages.find((m) => m.id === messageId);
  expect(beforeMessage).toEqual(transitions.before);

  // After state
  expect(state.messages.status[feature]).toBe(transitions.after.status);

  const afterMessage = state.messages.messages.find((m) => m.id === messageId);
  expect(afterMessage).toEqual(transitions.after.expectedMessage);

  if (transitions.after.error !== undefined) {
    expect(state.messages.error).toBe(transitions.after.error);
  }

  // Feature-specific assertions
  if (transitions.featureSpecific) {
    const {
      reactionCount,
      pollVotes,
      attachmentCount,
      mentionCount,
      readCount,
    } = transitions.featureSpecific;

    if (reactionCount !== undefined) {
      expect(afterMessage?.reactions?.length).toBe(reactionCount);
    }
    if (pollVotes !== undefined) {
      const totalVotes =
        afterMessage?.poll?.options.reduce(
          (sum, opt) => sum + opt.votes.length,
          0
        ) ?? 0;
      expect(totalVotes).toBe(pollVotes);
    }
    if (attachmentCount !== undefined) {
      expect(afterMessage?.attachments?.length).toBe(attachmentCount);
    }
    if (mentionCount !== undefined) {
      expect(afterMessage?.mentions?.length).toBe(mentionCount);
    }
    if (readCount !== undefined) {
      expect(afterMessage?.reads?.length).toBe(readCount);
    }
  }

  testLogger.assertLogged("debug", `Message ${feature} transition assertion`);
}
