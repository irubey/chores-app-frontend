import { testLogger } from "../../utils/testLogger";
import { createMockApiCall } from "../../mocks/apiMocks";
import { createMockMessageWithDetails } from "../../factories/messages/messageFactory";
import {
  createMockPoll,
  createMockPollOption,
  createMockPollVotes,
} from "../../factories/messages/pollFactory";
import { PollType, PollStatus } from "@shared/enums/poll";
import { generateId } from "../../utils/idGenerator";
import {
  MessageWithDetails,
  PollWithDetails,
  PollOptionWithVotes,
} from "@shared/types";

interface SetupPollScenarioOptions {
  pollType?: PollType;
  status?: PollStatus;
  optionCount?: number;
  voteCount?: number;
  withVotes?: boolean;
}

export const setupPollScenario = async ({
  pollType = PollType.MULTIPLE_CHOICE,
  status = PollStatus.OPEN,
  optionCount = 2,
  voteCount = 0,
  withVotes = false,
}: SetupPollScenarioOptions = {}) => {
  testLogger.debug("Setting up poll scenario", {
    pollType,
    status,
    optionCount,
    voteCount,
    withVotes,
  });

  const poll = createMockPoll(generateId("message"), {
    pollType,
    status,
    optionCount,
    voteCount,
    withVotes,
  });

  return {
    poll,
    response: await createMockApiCall(poll),
  };
};

interface SetupMessageWithPollOptions {
  optionCount?: number;
  voteCount?: number;
  pollType?: PollType;
  status?: PollStatus;
  messageOverrides?: Partial<MessageWithDetails>;
  pollOverrides?: Partial<PollWithDetails>;
}

export const setupMessageWithPollScenario = async ({
  optionCount = 2,
  voteCount = 0,
  pollType = PollType.MULTIPLE_CHOICE,
  status = PollStatus.OPEN,
  messageOverrides = {},
  pollOverrides = {},
}: SetupMessageWithPollOptions = {}) => {
  testLogger.debug("Setting up message with poll scenario", {
    optionCount,
    voteCount,
    pollType,
    status,
  });

  const message = createMockMessageWithDetails({ withPoll: true });
  const pollId = generateId("poll");

  const options: PollOptionWithVotes[] = Array.from(
    { length: optionCount },
    (_, i) =>
      createMockPollOption(pollId, {
        order: i,
        votes:
          voteCount > 0
            ? createMockPollVotes(pollId, generateId("option"), voteCount)
            : [],
        voteCount,
      })
  );

  const poll: PollWithDetails = {
    ...createMockPoll(message.id, {
      pollType,
      status,
      optionCount,
      voteCount,
    }),
    ...pollOverrides,
    options,
  };

  const updatedMessage: MessageWithDetails = {
    ...message,
    ...messageOverrides,
    poll,
  };

  return {
    message: updatedMessage,
    poll,
    response: await createMockApiCall(updatedMessage),
  };
};
