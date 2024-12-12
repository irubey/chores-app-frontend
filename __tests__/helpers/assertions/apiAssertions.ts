import { ApiResponse } from "@shared/interfaces";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";
import { testLogger } from "../utils/testLogger";
import {
  Message,
  Thread,
  User,
  Household,
  Chore,
  Expense,
  Notification,
  ThreadWithDetails,
  MessageWithDetails,
  Attachment,
  ReactionWithUser,
  MentionWithUser,
  PollWithDetails,
  PollOptionWithVotes,
  PollVoteWithUser,
  HouseholdMember,
  HouseholdMemberWithUser,
  HouseholdWithMembers,
  MessageReadStatus,
  ThreadWithParticipants,
  ThreadWithMessages,
} from "@shared/types";

// Basic API Response Assertions
export function assertApiSuccess<T>(response: ApiResponse<T>) {
  expect(response).toHaveProperty("data");
  expect(response.errors).toBeUndefined();
  expect(response.status).toBe(200);
  testLogger.assertAPIResponseLogged(200);
}

// Enhanced Error Assertions
export function assertApiError(
  error: ApiError,
  expectedConfig: {
    status: number;
    type: ApiErrorType;
    message?: string;
    data?: any;
  }
) {
  expect(error).toBeInstanceOf(ApiError);
  expect(error.status).toBe(expectedConfig.status);
  expect(error.type).toBe(expectedConfig.type);
  if (expectedConfig.message) {
    expect(error.message).toContain(expectedConfig.message);
  }
  if (expectedConfig.data) {
    expect(error.data).toMatchObject(expectedConfig.data);
  }
  testLogger.assertAPIErrorLogged(expectedConfig.type);
}

// Enhanced pagination assertions
export function assertCursorPagination<T>(
  response: ApiResponse<T[]>,
  config: {
    expectedPageSize: number;
    expectedDirection?: "asc" | "desc";
    previousCursor?: string;
  }
) {
  // Basic pagination structure
  expect(response.pagination).toBeDefined();
  expect(response.pagination).toHaveProperty("hasMore");

  // Data validation
  expect(Array.isArray(response.data)).toBe(true);
  expect(response.data.length).toBeLessThanOrEqual(config.expectedPageSize);

  // Cursor validation
  if (response.pagination?.hasMore) {
    expect(response.pagination.nextCursor).toBeDefined();
    expect(typeof response.pagination.nextCursor).toBe("string");

    // Ensure cursor is different from previous
    if (config.previousCursor) {
      expect(response.pagination.nextCursor).not.toBe(config.previousCursor);
    }
  }

  // If it's the last page
  if (!response.pagination?.hasMore) {
    expect(response.pagination?.nextCursor).toBeUndefined();
  }

  // Validate data order if direction is specified
  if (config.expectedDirection && response.data.length > 1) {
    const firstItem = response.data[0] as any;
    const lastItem = response.data[response.data.length - 1] as any;

    if (firstItem.createdAt && lastItem.createdAt) {
      if (config.expectedDirection === "desc") {
        expect(new Date(firstItem.createdAt).getTime()).toBeGreaterThan(
          new Date(lastItem.createdAt).getTime()
        );
      } else {
        expect(new Date(firstItem.createdAt).getTime()).toBeLessThan(
          new Date(lastItem.createdAt).getTime()
        );
      }
    }
  }
}

// Helper for testing infinite scroll scenarios
export function assertInfiniteScrollResponse<T>(
  currentResponse: ApiResponse<T[]>,
  previousResponse: ApiResponse<T[]>,
  config: {
    expectedPageSize: number;
    shouldHaveOverlap?: boolean;
  }
) {
  // Validate current page
  assertCursorPagination(currentResponse, {
    expectedPageSize: config.expectedPageSize,
    previousCursor: previousResponse.pagination?.nextCursor,
  });

  // Check for duplicates between pages (unless overlap is expected)
  if (!config.shouldHaveOverlap) {
    const previousIds = new Set(
      previousResponse.data.map((item: any) => item.id)
    );
    const currentIds = currentResponse.data.map((item: any) => item.id);

    currentIds.forEach((id) => {
      expect(previousIds.has(id)).toBe(false);
    });
  }

  // Validate continuous sequence
  if (previousResponse.data.length > 0 && currentResponse.data.length > 0) {
    const lastPreviousItem = previousResponse.data[
      previousResponse.data.length - 1
    ] as any;
    const firstCurrentItem = currentResponse.data[0] as any;

    if (lastPreviousItem.createdAt && firstCurrentItem.createdAt) {
      expect(
        new Date(lastPreviousItem.createdAt).getTime()
      ).toBeGreaterThanOrEqual(new Date(firstCurrentItem.createdAt).getTime());
    }
  }
}

// Type-Specific Response Assertions
export function assertMessageResponse(message: Message) {
  expect(message).toHaveProperty("id");
  expect(message).toHaveProperty("content");
  expect(message).toHaveProperty("threadId");
  expect(message).toHaveProperty("authorId");
  expect(message.createdAt).toBeInstanceOf(Date);
  expect(message.updatedAt).toBeInstanceOf(Date);
}

export function assertThreadResponse(thread: Thread) {
  expect(thread).toHaveProperty("id");
  expect(thread).toHaveProperty("householdId");
  expect(thread).toHaveProperty("authorId");
  expect(thread.createdAt).toBeInstanceOf(Date);
  expect(thread.updatedAt).toBeInstanceOf(Date);
}

export function assertUserResponse(user: User) {
  expect(user).toHaveProperty("id");
  expect(user).toHaveProperty("email");
  expect(user).toHaveProperty("name");
  expect(user.createdAt).toBeInstanceOf(Date);
  expect(user.updatedAt).toBeInstanceOf(Date);
}

// Collection Response Assertions
export function assertCollectionResponse<T>(
  response: ApiResponse<T[]>,
  itemAssertion: (item: T) => void
) {
  assertApiSuccess(response);
  expect(Array.isArray(response.data)).toBe(true);
  response.data.forEach(itemAssertion);
}

// Error Scenario Assertions
export function assertValidationError(
  error: ApiError,
  expectedFields: string[]
) {
  assertApiError(error, {
    status: 400,
    type: ApiErrorType.VALIDATION,
  });

  expectedFields.forEach((field) => {
    expect(error.data?.validationErrors?.[field]).toBeDefined();
  });
}

export function assertAuthenticationError(error: ApiError) {
  assertApiError(error, {
    status: 401,
    type: ApiErrorType.UNAUTHORIZED,
  });
}

export function assertAuthorizationError(error: ApiError) {
  assertApiError(error, {
    status: 403,
    type: ApiErrorType.FORBIDDEN,
  });
}

// Request Logging Assertions
export function assertRequestLogged(method: string, url: string) {
  testLogger.assertAPIRequestLogged(method, url);
}

// Response Transformation Assertions
export function assertDatesTransformed(obj: any) {
  const dateFields = [
    "createdAt",
    "updatedAt",
    "deletedAt",
    "dueDate",
    "joinedAt",
    "leftAt",
  ];
  dateFields.forEach((field) => {
    if (obj[field]) {
      expect(obj[field]).toBeInstanceOf(Date);
    }
  });
}

// Specific Feature Response Assertions
export function assertHouseholdResponse(household: Household) {
  expect(household).toHaveProperty("id");
  expect(household).toHaveProperty("name");
  expect(household).toHaveProperty("currency");
  expect(household).toHaveProperty("timezone");
  expect(household.createdAt).toBeInstanceOf(Date);
  expect(household.updatedAt).toBeInstanceOf(Date);
}

export function assertChoreResponse(chore: Chore) {
  expect(chore).toHaveProperty("id");
  expect(chore).toHaveProperty("title");
  expect(chore).toHaveProperty("householdId");
  expect(chore).toHaveProperty("status");
  expect(chore.createdAt).toBeInstanceOf(Date);
  expect(chore.updatedAt).toBeInstanceOf(Date);
}

export function assertExpenseResponse(expense: Expense) {
  expect(expense).toHaveProperty("id");
  expect(expense).toHaveProperty("amount");
  expect(expense).toHaveProperty("description");
  expect(expense).toHaveProperty("householdId");
  expect(expense).toHaveProperty("paidById");
  expect(expense.createdAt).toBeInstanceOf(Date);
  expect(expense.updatedAt).toBeInstanceOf(Date);
}

export function assertNotificationResponse(notification: Notification) {
  expect(notification).toHaveProperty("id");
  expect(notification).toHaveProperty("userId");
  expect(notification).toHaveProperty("type");
  expect(notification).toHaveProperty("message");
  expect(notification).toHaveProperty("isRead");
  expect(notification.createdAt).toBeInstanceOf(Date);
  expect(notification.updatedAt).toBeInstanceOf(Date);
}

// Auth Service Assertions
export function assertAuthResponse(response: ApiResponse<User>) {
  assertApiSuccess(response);
  assertUserResponse(response.data);
  testLogger.assertLogged("debug", "auth");
}

export function assertLoginResponse(response: ApiResponse<User>) {
  assertAuthResponse(response);
  // Add any login-specific checks
  testLogger.assertLogged("debug", "Logging in user");
}

export function assertRegisterResponse(response: ApiResponse<User>) {
  assertAuthResponse(response);
  // Add any registration-specific checks
  testLogger.assertLogged("debug", "Registering new user");
}

// Thread Service Assertions
export function assertThreadWithDetailsResponse(thread: ThreadWithDetails) {
  assertThreadResponse(thread);
  expect(thread.author).toBeDefined();
  assertUserResponse(thread.author);
  expect(thread.household).toBeDefined();
  assertHouseholdResponse(thread.household);
  expect(Array.isArray(thread.messages)).toBe(true);
  thread.messages.forEach(assertMessageWithDetailsResponse);
  expect(Array.isArray(thread.participants)).toBe(true);
  thread.participants.forEach(assertHouseholdMemberResponse);
}

export function assertMessageWithDetailsResponse(message: MessageWithDetails) {
  assertMessageResponse(message);
  expect(message.thread).toBeDefined();
  assertThreadResponse(message.thread);
  expect(message.author).toBeDefined();
  assertUserResponse(message.author);

  if (message.attachments) {
    message.attachments.forEach(assertAttachmentResponse);
  }
  if (message.reactions) {
    message.reactions.forEach(assertReactionResponse);
  }
  if (message.mentions) {
    message.mentions.forEach(assertMentionResponse);
  }
  if (message.poll) {
    assertPollResponse(message.poll);
  }
}

export function assertAttachmentResponse(attachment: Attachment) {
  expect(attachment).toHaveProperty("id");
  expect(attachment).toHaveProperty("messageId");
  expect(attachment).toHaveProperty("url");
  expect(attachment).toHaveProperty("fileType");
  expect(attachment.createdAt).toBeInstanceOf(Date);
  expect(attachment.updatedAt).toBeInstanceOf(Date);
}

export function assertReactionResponse(reaction: ReactionWithUser) {
  expect(reaction).toHaveProperty("id");
  expect(reaction).toHaveProperty("messageId");
  expect(reaction).toHaveProperty("userId");
  expect(reaction).toHaveProperty("emoji");
  expect(reaction).toHaveProperty("type");
  expect(reaction.createdAt).toBeInstanceOf(Date);
  expect(reaction.user).toBeDefined();
  assertUserResponse(reaction.user);
}

export function assertMentionResponse(mention: MentionWithUser) {
  expect(mention).toHaveProperty("id");
  expect(mention).toHaveProperty("messageId");
  expect(mention).toHaveProperty("userId");
  expect(mention.mentionedAt).toBeInstanceOf(Date);
  expect(mention.user).toBeDefined();
  assertUserResponse(mention.user);
}

export function assertPollResponse(poll: PollWithDetails) {
  expect(poll).toHaveProperty("id");
  expect(poll).toHaveProperty("messageId");
  expect(poll).toHaveProperty("question");
  expect(poll).toHaveProperty("pollType");
  expect(poll).toHaveProperty("status");
  expect(poll.createdAt).toBeInstanceOf(Date);
  expect(poll.updatedAt).toBeInstanceOf(Date);
  expect(Array.isArray(poll.options)).toBe(true);
  poll.options.forEach(assertPollOptionResponse);
}

export function assertPollOptionResponse(option: PollOptionWithVotes) {
  expect(option).toHaveProperty("id");
  expect(option).toHaveProperty("pollId");
  expect(option).toHaveProperty("text");
  expect(option).toHaveProperty("order");
  expect(option.createdAt).toBeInstanceOf(Date);
  expect(option.updatedAt).toBeInstanceOf(Date);
  expect(Array.isArray(option.votes)).toBe(true);
  option.votes.forEach(assertPollVoteResponse);
}

export function assertPollVoteResponse(vote: PollVoteWithUser) {
  expect(vote).toHaveProperty("id");
  expect(vote).toHaveProperty("optionId");
  expect(vote).toHaveProperty("pollId");
  expect(vote).toHaveProperty("userId");
  expect(vote.createdAt).toBeInstanceOf(Date);
  expect(vote.user).toBeDefined();
  assertUserResponse(vote.user);
}

// Household Service Assertions
export function assertHouseholdMemberResponse(member: HouseholdMember) {
  expect(member).toHaveProperty("id");
  expect(member).toHaveProperty("userId");
  expect(member).toHaveProperty("householdId");
  expect(member).toHaveProperty("role");
  expect(member.joinedAt).toBeInstanceOf(Date);
  expect(member).toHaveProperty("isInvited");
  expect(member).toHaveProperty("isAccepted");
  expect(member).toHaveProperty("isRejected");
  expect(member).toHaveProperty("isSelected");
}

export function assertHouseholdMemberWithUserResponse(
  member: HouseholdMemberWithUser
) {
  assertHouseholdMemberResponse(member);
  if (member.user) {
    assertUserResponse(member.user);
  }
  if (member.household) {
    assertHouseholdResponse(member.household);
  }
}

export function assertHouseholdWithMembersResponse(
  household: HouseholdWithMembers
) {
  assertHouseholdResponse(household);
  if (household.members) {
    expect(Array.isArray(household.members)).toBe(true);
    household.members.forEach(assertHouseholdMemberResponse);
  }
}

// Message Read Status Assertions
export function assertMessageReadStatusResponse(status: MessageReadStatus) {
  expect(status).toHaveProperty("messageId");
  expect(Array.isArray(status.readBy)).toBe(true);
  status.readBy.forEach((readStatus) => {
    expect(readStatus).toHaveProperty("userId");
    expect(readStatus).toHaveProperty("readAt");
    expect(readStatus.readAt).toBeInstanceOf(Date);
  });
  expect(Array.isArray(status.unreadBy)).toBe(true);
}

export function assertHouseholdInvitationResponse(invitation: HouseholdMember) {
  assertHouseholdMemberResponse(invitation);
  expect(invitation.isInvited).toBe(true);
  expect(invitation.isAccepted).toBe(false);
  testLogger.assertLogged("debug", "Household invitation");
}

export function assertThreadWithParticipantsResponse(
  thread: ThreadWithParticipants
) {
  assertThreadResponse(thread);
  expect(Array.isArray(thread.participants)).toBe(true);
  thread.participants.forEach(assertHouseholdMemberResponse);
}

export function assertThreadWithMessagesResponse(thread: ThreadWithMessages) {
  assertThreadResponse(thread);
  expect(Array.isArray(thread.messages)).toBe(true);
  thread.messages.forEach(assertMessageWithDetailsResponse);
}
