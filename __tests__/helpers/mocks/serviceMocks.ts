import { ApiResponse, PaginationOptions } from "@shared/interfaces";
import { testLogger } from "../utils/testLogger";
import {
  User,
  LoginCredentials,
  RegisterUserDTO,
  UpdateUserDTO,
  Household,
  HouseholdMember,
  HouseholdMemberWithUser,
  Thread,
  ThreadWithDetails,
  ThreadWithMessages,
  ThreadWithParticipants,
  MessageWithDetails,
  CreateThreadDTO,
  CreateMessageDTO,
  UpdateMessageDTO,
  ReactionWithUser,
  PollWithDetails,
  Attachment,
  MentionWithUser,
  MessageReadStatus,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
  CreateReactionDTO,
  CreatePollDTO,
  UpdateThreadDTO,
  CreateMentionDTO,
  Poll,
  UpdatePollDTO,
  CreatePollVoteDTO,
  PollVoteWithUser,
  PollOptionWithVotes,
} from "@shared/types";
import { createMockApiResponse, createMockApiCall } from "./apiMocks";
import {
  createMockUser,
  createMockLoginCredentials,
  createMockRegisterDTO,
} from "../factories/userFactory";
import {
  createMockHousehold,
  createMockHouseholdMember,
  createMockHouseholdWithMembers,
} from "../factories/householdFactory";
import {
  createMockThread,
  createMockThreadWithDetails,
  createMockThreadWithMessages,
} from "../factories/threadFactory";
import {
  createMockMessage,
  createMockMessageWithDetails,
} from "../factories/messages/messageFactory";
import { createMockAttachment } from "../factories/messages/attachmentFactory";
import { createMockMention } from "../factories/messages/mentionFactory";
import {
  createMockPoll,
  CreatePollOptions,
} from "../factories/messages/pollFactory";
import { createMockReaction } from "../factories/messages/reactionFactory";
import { HouseholdRole } from "@shared/enums";
import { generateId } from "../utils/idGenerator";
import { PollType, PollStatus } from "@shared/enums/poll";
import { setupMessageUpdateEventScenario } from "../scenarios/messages/messageScenarios";

// Mock Service Configuration Types
interface MockServiceOptions {
  shouldSucceed?: boolean;
  delay?: number;
}

// Add interface extension for thread options
interface ThreadServiceOptions extends MockServiceOptions {
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
}

interface MockPaginationConfig extends PaginationOptions {
  shouldSucceed?: boolean;
  delay?: number;
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
}

/**
 * Mock implementation of AuthService
 */
export const createMockAuthService = (options: MockServiceOptions = {}) => ({
  register: jest.fn().mockImplementation(async (data: RegisterUserDTO) => {
    testLogger.debug("Mock AuthService: Registering user", {
      email: data.email,
      name: data.name,
    });
    return createMockApiCall(
      createMockUser({}, { email: data.email, name: data.name }),
      {
        shouldSucceed: options.shouldSucceed,
        delay: options.delay,
      }
    );
  }),

  login: jest.fn().mockImplementation(async (credentials: LoginCredentials) => {
    testLogger.debug("Mock AuthService: Logging in user", {
      email: credentials.email,
    });
    return createMockApiCall(createMockUser({}, { email: credentials.email }), {
      shouldSucceed: options.shouldSucceed,
      delay: options.delay,
    });
  }),

  logout: jest.fn().mockImplementation(async () => {
    testLogger.debug("Mock AuthService: Logging out user");
    return createMockApiCall(undefined, {
      shouldSucceed: options.shouldSucceed,
      delay: options.delay,
    });
  }),

  initializeAuth: jest.fn().mockImplementation(async () => {
    testLogger.debug("Mock AuthService: Initializing auth");
    return createMockApiCall(createMockUser(), {
      shouldSucceed: options.shouldSucceed,
      delay: options.delay,
    });
  }),
});

/**
 * Mock implementation of UserService
 */
export const createMockUserService = (options: MockServiceOptions = {}) => ({
  getProfile: jest.fn().mockImplementation(async () => {
    testLogger.debug("Mock UserService: Getting user profile");
    return createMockApiCall(createMockUser(), {
      shouldSucceed: options.shouldSucceed,
      delay: options.delay,
    });
  }),

  updateProfile: jest
    .fn()
    .mockImplementation(async (userData: UpdateUserDTO) => {
      testLogger.debug("Mock UserService: Updating user profile", { userData });
      return createMockApiCall(createMockUser({}, userData), {
        shouldSucceed: options.shouldSucceed,
        delay: options.delay,
      });
    }),
});

/**
 * Mock implementation of HouseholdService
 */
export const createMockHouseholdService = (
  options: MockServiceOptions = {}
) => ({
  getUserHouseholds: jest.fn().mockImplementation(async () => {
    testLogger.debug("Mock HouseholdService: Getting user households");
    return createMockApiCall(createMockHouseholdWithMembers(), {
      shouldSucceed: options.shouldSucceed,
      delay: options.delay,
    });
  }),

  createHousehold: jest
    .fn()
    .mockImplementation(async (data: CreateHouseholdDTO) => {
      testLogger.debug("Mock HouseholdService: Creating household", { data });
      return createMockApiCall(
        createMockHouseholdWithMembers({
          withMembers: true,
          memberCount: 1,
        }),
        {
          shouldSucceed: options.shouldSucceed,
          delay: options.delay,
        }
      );
    }),

  getHousehold: jest.fn().mockImplementation(async (householdId: string) => {
    testLogger.debug("Mock HouseholdService: Getting household", {
      householdId,
    });
    return createMockApiCall(
      createMockHouseholdWithMembers({
        withMembers: true,
        memberCount: 2,
      }),
      {
        shouldSucceed: options.shouldSucceed,
        delay: options.delay,
      }
    );
  }),

  updateHousehold: jest
    .fn()
    .mockImplementation(
      async (householdId: string, data: UpdateHouseholdDTO) => {
        testLogger.debug("Mock HouseholdService: Updating household", {
          householdId,
          data,
        });
        // Create the household first with base data
        const household = createMockHousehold({
          id: householdId,
          name: data.name,
          currency: data.currency,
          timezone: data.timezone,
          language: data.language,
        });

        // Then create the household with members using the household data
        return createMockApiCall(
          createMockHouseholdWithMembers({
            withMembers: true,
            memberCount: 2,
            withAdmin: true,
          }),
          {
            shouldSucceed: options.shouldSucceed,
            delay: options.delay,
          }
        );
      }
    ),

  deleteHousehold: jest.fn().mockImplementation(async (householdId: string) =>
    createMockApiCall(undefined, {
      shouldSucceed: options.shouldSucceed,
      delay: options.delay,
    })
  ),

  members: {
    getMembers: jest.fn().mockImplementation(async (householdId: string) => {
      testLogger.debug("Mock HouseholdService: Getting members", {
        householdId,
      });
      return createMockApiCall(
        Array.from({ length: 3 }, () =>
          createMockHouseholdMember({ isAdmin: false })
        ),
        {
          shouldSucceed: options.shouldSucceed,
          delay: options.delay,
        }
      );
    }),

    addMember: jest
      .fn()
      .mockImplementation(async (householdId: string, data: AddMemberDTO) => {
        testLogger.debug("Mock HouseholdService: Adding member", {
          householdId,
          data,
        });
        return createMockApiCall(
          createMockHouseholdMember({
            isInvited: true,
            isAccepted: false,
          }),
          {
            shouldSucceed: options.shouldSucceed,
            delay: options.delay,
          }
        );
      }),

    removeMember: jest
      .fn()
      .mockImplementation(async (householdId: string, memberId: string) =>
        createMockApiCall(undefined, {
          shouldSucceed: options.shouldSucceed,
          delay: options.delay,
        })
      ),

    updateMemberRole: jest
      .fn()
      .mockImplementation(
        async (householdId: string, memberId: string, role: HouseholdRole) =>
          createMockApiCall(
            createMockHouseholdMember({}, { householdId, role }),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          )
      ),

    updateSelection: jest
      .fn()
      .mockImplementation(
        async (householdId: string, memberId: string, isSelected: boolean) =>
          createMockApiCall(
            createMockHouseholdMember({}, { householdId, isSelected }),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          )
      ),
  },

  invitations: {
    sendInvitation: jest
      .fn()
      .mockImplementation(async (householdId: string, email: string) => {
        testLogger.debug("Mock HouseholdService: Sending invitation", {
          householdId,
          email,
        });
        return createMockApiCall(undefined, {
          shouldSucceed: options.shouldSucceed,
          delay: options.delay,
        });
      }),

    getInvitations: jest.fn().mockImplementation(async () => {
      testLogger.debug("Mock HouseholdService: Getting invitations");
      return createMockApiCall(
        Array.from({ length: 2 }, () =>
          createMockHouseholdMember({
            isInvited: true,
            isAccepted: false,
          })
        ),
        {
          shouldSucceed: options.shouldSucceed,
          delay: options.delay,
        }
      );
    }),

    updateMemberInvitationStatus: jest
      .fn()
      .mockImplementation(
        async (householdId: string, memberId: string, accept: boolean) =>
          createMockApiCall(
            createMockHouseholdMember({
              isInvited: false,
              isAccepted: accept,
              isSelected: !accept,
            }),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          )
      ),
  },

  getSelectedHouseholds: jest.fn().mockImplementation(async () =>
    createMockApiCall(
      Array.from({ length: 2 }, () =>
        createMockHouseholdMember({ isSelected: true })
      ),
      {
        shouldSucceed: options.shouldSucceed,
        delay: options.delay,
      }
    )
  ),
});

/**
 * Mock implementation of ThreadService
 */
export const createMockThreadService = (options: MockServiceOptions = {}) => ({
  threads: {
    getThreads: jest
      .fn()
      .mockImplementation(
        async (householdId: string, paginationOpts?: PaginationOptions) => {
          testLogger.debug("Mock ThreadService: Getting threads", {
            householdId,
            paginationOpts,
          });
          return createMockApiCall(
            Array.from({ length: 3 }, () =>
              createMockThreadWithDetails({ withMessages: true })
            ),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
              pagination: {
                hasMore: false,
                nextCursor: undefined,
              },
            }
          );
        }
      ),

    createThread: jest
      .fn()
      .mockImplementation(
        async (householdId: string, threadData: CreateThreadDTO) => {
          testLogger.debug("Mock ThreadService: Creating thread", {
            householdId,
            threadData,
          });
          return createMockApiCall(
            createMockThreadWithDetails({
              withMessages: true,
              messageCount: 1,
              withParticipants: true,
            }),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          );
        }
      ),

    getThreadDetails: jest
      .fn()
      .mockImplementation(async (householdId: string, threadId: string) => {
        testLogger.debug("Mock ThreadService: Getting thread details", {
          householdId,
          threadId,
        });
        return createMockApiCall(
          createMockThreadWithMessages({
            messageCount: 5,
            withParticipants: true,
          }),
          {
            shouldSucceed: options.shouldSucceed,
            delay: options.delay,
          }
        );
      }),

    updateThread: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          data: UpdateThreadDTO
        ) => {
          testLogger.debug("Mock ThreadService: Updating thread", {
            householdId,
            threadId,
            data,
          });
          return createMockApiCall(
            createMockThread({ withMessages: true }, { title: data.title }),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          );
        }
      ),

    deleteThread: jest
      .fn()
      .mockImplementation(async (householdId: string, threadId: string) => {
        testLogger.debug("Mock ThreadService: Deleting thread", {
          householdId,
          threadId,
        });
        return createMockApiCall(undefined, {
          shouldSucceed: options.shouldSucceed,
          delay: options.delay,
        });
      }),

    inviteUsers: jest
      .fn()
      .mockImplementation(
        async (householdId: string, threadId: string, userIds: string[]) => {
          testLogger.debug("Mock ThreadService: Inviting users to thread", {
            householdId,
            threadId,
            userCount: userIds.length,
          });
          return createMockApiCall(
            createMockThreadWithDetails({
              withParticipants: true,
              participantCount: userIds.length,
            }),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          );
        }
      ),
  },

  messages: {
    getMessages: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          paginationOpts?: PaginationOptions
        ) => {
          testLogger.debug("Mock MessageService: Getting messages", {
            householdId,
            threadId,
            paginationOpts,
          });
          return createMockApiCall(
            Array.from({ length: 5 }, () =>
              createMockMessageWithDetails({
                withAttachments: true,
                withReactions: true,
                withMentions: true,
              })
            ),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
              pagination: {
                hasMore: false,
                nextCursor: undefined,
              },
            }
          );
        }
      ),

    createMessage: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageData: CreateMessageDTO
        ) => {
          testLogger.debug("Mock MessageService: Creating message", {
            householdId,
            threadId,
            messageData,
          });
          return createMockApiCall(
            createMockMessageWithDetails({
              withAttachments: !!messageData.attachments?.length,
              withMentions: !!messageData.mentions?.length,
              withPoll: !!messageData.poll,
            }),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          );
        }
      ),

    updateMessage: jest
      .fn()
      .mockImplementation(
        async (
          householdId: string,
          threadId: string,
          messageId: string,
          data: UpdateMessageDTO
        ) => {
          testLogger.debug("Mock MessageService: Updating message", {
            householdId,
            threadId,
            messageId,
            data,
          });
          return createMockApiCall(
            createMockMessageWithDetails(
              {
                withAttachments: false,
                withReactions: false,
                withMentions: false,
                withPoll: false,
              },
              {
                id: messageId,
                threadId,
                content: data.content,
              }
            ),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          );
        }
      ),

    deleteMessage: jest
      .fn()
      .mockImplementation(
        async (householdId: string, threadId: string, messageId: string) => {
          testLogger.debug("Mock MessageService: Deleting message", {
            householdId,
            threadId,
            messageId,
          });
          return createMockApiCall(undefined, {
            shouldSucceed: options.shouldSucceed,
            delay: options.delay,
          });
        }
      ),

    readStatus: {
      markAsRead: jest
        .fn()
        .mockImplementation(
          async (householdId: string, threadId: string, messageId: string) => {
            testLogger.debug("Mock MessageService: Marking message as read", {
              householdId,
              threadId,
              messageId,
            });
            return createMockApiCall(
              { userId: "user-123", readAt: new Date().toISOString() },
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),

      getReadStatus: jest
        .fn()
        .mockImplementation(
          async (householdId: string, threadId: string, messageId: string) => {
            testLogger.debug(
              "Mock MessageService: Getting message read status",
              {
                householdId,
                threadId,
                messageId,
              }
            );
            return createMockApiCall(
              {
                readers: [
                  { userId: "user-123", readAt: "2023-10-01T12:00:00Z" },
                  { userId: "user-456", readAt: "2023-10-01T12:05:00Z" },
                ],
              },
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),
    },

    reactions: {
      addReaction: jest
        .fn()
        .mockImplementation(
          async (
            householdId: string,
            threadId: string,
            messageId: string,
            reactionData: CreateReactionDTO
          ) => {
            testLogger.debug("Mock MessageService: Adding reaction", {
              householdId,
              threadId,
              messageId,
              reactionData,
            });
            return createMockApiCall(createMockReaction(messageId), {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            });
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
            testLogger.debug("Mock MessageService: Removing reaction", {
              householdId,
              threadId,
              messageId,
              reactionId,
            });
            return createMockApiCall(undefined, {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            });
          }
        ),

      getReactions: jest
        .fn()
        .mockImplementation(
          async (householdId: string, threadId: string, messageId: string) => {
            testLogger.debug("Mock MessageService: Getting reactions", {
              householdId,
              threadId,
              messageId,
            });
            return createMockApiCall(
              Array.from({ length: 3 }, () => createMockReaction(messageId)),
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),

      getReactionAnalytics: jest
        .fn()
        .mockImplementation(
          async (householdId: string, threadId: string, messageId: string) => {
            testLogger.debug(
              "Mock MessageService: Getting reaction analytics",
              {
                householdId,
                threadId,
                messageId,
              }
            );
            return createMockApiCall(
              { like: 10, love: 5, haha: 2 },
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),

      getReactionsByType: jest
        .fn()
        .mockImplementation(async (householdId: string) => {
          testLogger.debug("Mock MessageService: Getting reactions by type", {
            householdId,
          });
          return createMockApiCall(
            {
              like: 15,
              love: 7,
              haha: 3,
              wow: 2,
            },
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          );
        }),
    },

    mentions: {
      getUserMentions: jest
        .fn()
        .mockImplementation(async (householdId: string, messageId: string) => {
          testLogger.debug("Mock MessageService: Getting user mentions", {
            householdId,
            messageId,
          });
          return createMockApiCall(
            Array.from({ length: 4 }, () => createMockMention(messageId)),
            {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            }
          );
        }),

      getMessageMentions: jest
        .fn()
        .mockImplementation(
          async (householdId: string, threadId: string, messageId: string) => {
            testLogger.debug("Mock MessageService: Getting message mentions", {
              householdId,
              threadId,
              messageId,
            });
            return createMockApiCall(
              Array.from({ length: 2 }, () => createMockMention(messageId)),
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),

      createMention: jest
        .fn()
        .mockImplementation(
          async (
            householdId: string,
            threadId: string,
            messageId: string,
            mentionData: CreateMentionDTO
          ) => {
            testLogger.debug("Mock MessageService: Creating mention", {
              householdId,
              threadId,
              messageId,
              mentionData,
            });
            return createMockApiCall(createMockMention(messageId), {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            });
          }
        ),

      deleteMention: jest
        .fn()
        .mockImplementation(
          async (
            householdId: string,
            threadId: string,
            messageId: string,
            mentionId: string
          ) => {
            testLogger.debug("Mock MessageService: Deleting mention", {
              householdId,
              threadId,
              messageId,
              mentionId,
            });
            return createMockApiCall(undefined, {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            });
          }
        ),

      getUnreadMentionsCount: jest
        .fn()
        .mockImplementation(async (householdId: string) => {
          testLogger.debug(
            "Mock MessageService: Getting unread mentions count",
            { householdId }
          );
          return createMockApiCall(5, {
            shouldSucceed: options.shouldSucceed,
            delay: options.delay,
          });
        }),
    },

    polls: {
      createPoll: jest
        .fn()
        .mockImplementation(
          async (
            householdId: string,
            threadId: string,
            messageId: string,
            pollData: CreatePollDTO
          ) => {
            testLogger.debug("Mock MessageService: Creating poll", {
              householdId,
              threadId,
              messageId,
              pollData,
            });
            const pollOptions: CreatePollOptions = {
              pollType: pollData.pollType,
              optionCount: pollData.options.length,
              withVotes: false,
              status: PollStatus.OPEN,
            };
            return createMockApiCall(createMockPoll(messageId, pollOptions), {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            });
          }
        ),

      getPollsInThread: jest
        .fn()
        .mockImplementation(
          async (householdId: string, threadId: string, messageId: string) => {
            testLogger.debug("Mock MessageService: Getting polls in thread", {
              householdId,
              threadId,
              messageId,
            });
            return createMockApiCall(
              Array.from({ length: 2 }, () => createMockPoll(messageId)),
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),

      getPoll: jest
        .fn()
        .mockImplementation(
          async (
            householdId: string,
            threadId: string,
            messageId: string,
            pollId: string
          ) => {
            testLogger.debug("Mock MessageService: Getting a single poll", {
              householdId,
              threadId,
              messageId,
              pollId,
            });
            const pollOptions: CreatePollOptions = {
              withVotes: true,
              optionCount: 2,
              status: PollStatus.OPEN,
            };
            return createMockApiCall(createMockPoll(messageId, pollOptions), {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            });
          }
        ),

      updatePoll: jest
        .fn()
        .mockImplementation(
          async (
            householdId: string,
            threadId: string,
            messageId: string,
            pollId: string,
            pollData: UpdatePollDTO
          ) => {
            testLogger.debug("Mock MessageService: Updating poll", {
              householdId,
              threadId,
              messageId,
              pollId,
              pollData,
            });
            const pollOptions: CreatePollOptions = {
              status: pollData.status,
              withVotes: false,
            };
            return createMockApiCall(
              { ...createMockPoll(messageId, pollOptions), ...pollData },
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),

      deletePoll: jest
        .fn()
        .mockImplementation(
          async (
            householdId: string,
            threadId: string,
            messageId: string,
            pollId: string
          ) => {
            testLogger.debug("Mock MessageService: Deleting poll", {
              householdId,
              threadId,
              messageId,
              pollId,
            });
            return createMockApiCall(undefined, {
              shouldSucceed: options.shouldSucceed,
              delay: options.delay,
            });
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
            testLogger.debug("Mock MessageService: Voting on poll", {
              householdId,
              threadId,
              messageId,
              pollId,
              vote,
            });
            const pollOptions: CreatePollOptions = {
              withVotes: true,
              voteCount: 1,
            };
            const poll = createMockPoll(messageId, pollOptions);

            const newVote: PollVoteWithUser = {
              id: generateId("vote"),
              pollId,
              optionId: vote.optionId,
              userId: generateId("user"),
              rank: vote.rank,
              availability: vote.availability,
              createdAt: new Date(),
              user: createMockUser(),
            };

            const updatedOptions = poll.options.map((option) =>
              option.id === vote.optionId
                ? {
                    ...option,
                    votes: [...option.votes, newVote],
                    voteCount: option.voteCount + 1,
                  }
                : option
            );

            const updatedPoll: PollWithDetails = {
              ...poll,
              options: updatedOptions,
            };

            return createMockApiCall(
              { poll: updatedPoll, messageId },
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),

      removePollVote: jest
        .fn()
        .mockImplementation(
          async (
            householdId: string,
            threadId: string,
            messageId: string,
            pollId: string,
            optionId: string
          ) => {
            testLogger.debug("Mock MessageService: Removing poll vote", {
              householdId,
              threadId,
              messageId,
              pollId,
              optionId,
            });
            const pollOptions: CreatePollOptions = {
              withVotes: true,
              voteCount: 1,
            };
            const poll = createMockPoll(messageId, pollOptions);

            const updatedOptions = poll.options.map((option) =>
              option.id === optionId
                ? {
                    ...option,
                    votes: option.votes.filter((v) => v.optionId !== optionId),
                    voteCount: option.voteCount - 1,
                  }
                : option
            );

            const updatedPoll: PollWithDetails = {
              ...poll,
              options: updatedOptions,
            };

            return createMockApiCall(
              { poll: updatedPoll, messageId },
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),

      getPollAnalytics: jest
        .fn()
        .mockImplementation(
          async (
            householdId: string,
            threadId: string,
            messageId: string,
            pollId: string
          ) => {
            testLogger.debug("Mock MessageService: Getting poll analytics", {
              householdId,
              threadId,
              messageId,
              pollId,
            });
            return createMockApiCall(
              { totalVotes: 20, optionBreakdown: { yes: 12, no: 8 } },
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),
    },

    attachments: {
      getAttachments: jest
        .fn()
        .mockImplementation(
          async (householdId: string, threadId: string, messageId: string) => {
            testLogger.debug("Mock MessageService: Getting attachments", {
              householdId,
              threadId,
              messageId,
            });
            return createMockApiCall(
              Array.from({ length: 2 }, () => createMockAttachment(messageId)),
              {
                shouldSucceed: options.shouldSucceed,
                delay: options.delay,
              }
            );
          }
        ),
    },
  },
});

// Type exports for mock services
export type MockAuthService = ReturnType<typeof createMockAuthService>;
export type MockUserService = ReturnType<typeof createMockUserService>;
export type MockHouseholdService = ReturnType<
  typeof createMockHouseholdService
>;
export type MockThreadService = ReturnType<typeof createMockThreadService>;
