import {
  PollWithDetails,
  PollOptionWithVotes,
  CreatePollDTO,
  PollVoteWithUser,
  PollUpdateEvent,
} from "@shared/types";
import { PollType, PollStatus, MessageAction } from "@shared/enums";
import { generateId } from "../../utils/idGenerator";
import { createMockUser } from "../userFactory";

export interface CreatePollOptions {
  withVotes?: boolean;
  voteCount?: number;
  optionCount?: number;
  status?: PollStatus;
  pollType?: PollType;
}

export function createMockPoll(
  messageId: string = generateId("message"),
  pollOptions: CreatePollOptions = {},
  overrides: Partial<PollWithDetails> = {}
): PollWithDetails {
  const {
    withVotes = false,
    voteCount = 2,
    optionCount = 2,
    status = PollStatus.OPEN,
    pollType = PollType.MULTIPLE_CHOICE,
  } = pollOptions;

  const pollId = generateId("poll");
  const pollOptionsList = Array.from({ length: optionCount }, (_, index) =>
    createMockPollOption(pollId, {
      order: index,
      votes: withVotes
        ? createMockPollVotes(pollId, generateId("option"), voteCount)
        : [],
    })
  );

  return {
    id: pollId,
    messageId,
    question: "Test poll question?",
    pollType,
    status,
    maxChoices: undefined,
    maxRank: undefined,
    endDate: undefined,
    eventId: undefined,
    selectedOptionId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    options: pollOptionsList,
    selectedOption: undefined,
    event: undefined,
    ...overrides,
  };
}

export function createMockPollOption(
  pollId: string,
  overrides: Partial<PollOptionWithVotes> = {}
): PollOptionWithVotes {
  return {
    id: generateId("option"),
    pollId,
    text: `Option ${overrides.order ?? 0 + 1}`,
    order: 0,
    startTime: undefined,
    endTime: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    votes: [],
    voteCount: 0,
    ...overrides,
  };
}

export function createMockPollVote(
  pollId: string,
  optionId: string,
  overrides: Partial<PollVoteWithUser> = {}
): PollVoteWithUser {
  const user = createMockUser();

  return {
    id: generateId("vote"),
    pollId,
    optionId,
    userId: user.id,
    rank: undefined,
    availability: undefined,
    createdAt: new Date(),
    user,
    ...overrides,
  };
}

export function createMockPollVotes(
  pollId: string,
  optionId: string,
  count: number
): PollVoteWithUser[] {
  return Array.from({ length: count }, () =>
    createMockPollVote(pollId, optionId)
  );
}

export function createMockPollDTO(
  overrides: Partial<CreatePollDTO> = {}
): CreatePollDTO {
  return {
    question: "Test poll question?",
    pollType: PollType.MULTIPLE_CHOICE,
    options: [
      { text: "Option 1", order: 0 },
      { text: "Option 2", order: 1 },
    ],
    ...overrides,
  };
}

export function createMockPollEvent(
  action:
    | MessageAction.POLL_CREATED
    | MessageAction.POLL_UPDATED
    | MessageAction.POLL_VOTED
): PollUpdateEvent {
  const messageId = generateId("message");
  const poll = createMockPoll(messageId);

  return {
    action,
    messageId,
    poll,
  };
}
