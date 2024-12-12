import { apiClient } from "@/lib/api/apiClient";
import { createMockApiResponse } from "../../helpers/mocks/apiMocks";
import { setupMessageWithPollScenario } from "../../helpers/scenarios/messages/pollScenarios";
import {
  assertApiSuccess,
  assertPollResponse,
} from "../../helpers/assertions/apiAssertions";
import { createMockMessageWithDetails } from "../../helpers/factories/messages/messageFactory";
import {
  createMockPoll,
  createMockPollDTO,
  createMockPollVote,
} from "../../helpers/factories/messages/pollFactory";
import { testLogger } from "../../helpers/utils/testLogger";
import { PollStatus, PollType } from "@shared/enums";

jest.mock("@/lib/api/apiClient");

describe("Message Polls Service", () => {
  let householdId: string;
  let threadId: string;
  let messageId: string;

  beforeEach(() => {
    const message = createMockMessageWithDetails();
    householdId = message.thread.householdId;
    threadId = message.thread.id;
    messageId = message.id;

    testLogger.debug("Setting up test data", {
      householdId,
      threadId,
      messageId,
    });
  });

  afterEach(() => {
    testLogger.debug("Cleaning up test data");
    jest.clearAllMocks();
  });

  describe("polls", () => {
    it("creates a poll", async () => {
      // Arrange
      const pollDTO = createMockPollDTO();
      const mockPoll = createMockPoll(messageId);
      const mockResponse = createMockApiResponse(mockPoll);

      (
        apiClient.threads.messages.polls.createPoll as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.polls.createPoll(
        householdId,
        threadId,
        messageId,
        pollDTO
      );

      // Assert
      assertApiSuccess(result);
      assertPollResponse(result.data);
      expect(result.data.question).toBe(pollDTO.question);
    });

    it("updates a poll", async () => {
      // Arrange
      const pollId = "poll-1";
      const updateData = {
        question: "Updated question",
        status: PollStatus.CLOSED,
      };
      const mockUpdatedPoll = {
        ...createMockPoll(messageId),
        ...updateData,
      };
      const mockResponse = createMockApiResponse(mockUpdatedPoll);

      (
        apiClient.threads.messages.polls.updatePoll as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.polls.updatePoll(
        householdId,
        threadId,
        messageId,
        pollId,
        updateData
      );

      // Assert
      assertApiSuccess(result);
      assertPollResponse(result.data);
      expect(result.data.question).toBe(updateData.question);
      expect(result.data.status).toBe(updateData.status);
    });

    it("votes on a poll", async () => {
      // Arrange
      const pollId = "poll-1";
      const voteData = { optionId: "option-1" };
      const mockVote = createMockPollVote(pollId, voteData.optionId);
      const mockResponse = createMockApiResponse(mockVote);

      (
        apiClient.threads.messages.polls.votePoll as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.polls.votePoll(
        householdId,
        threadId,
        messageId,
        pollId,
        voteData
      );

      // Assert
      assertApiSuccess(result);
      expect(result.data.optionId).toBe(voteData.optionId);
      expect(result.data.user).toBeDefined();
    });

    it("gets polls in thread", async () => {
      // Arrange
      const { message, poll, response } = await setupMessageWithPollScenario({
        optionCount: 2,
        pollType: PollType.MULTIPLE_CHOICE,
      });

      (
        apiClient.threads.messages.polls.getPollsInThread as jest.Mock
      ).mockResolvedValue(response);

      // Act
      const result = await apiClient.threads.messages.polls.getPollsInThread(
        householdId,
        threadId,
        messageId
      );

      // Assert
      assertApiSuccess(result);
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach(assertPollResponse);
    });

    it("gets poll analytics", async () => {
      // Arrange
      const pollId = "poll-1";
      const mockAnalytics = {
        totalVotes: 20,
        optionBreakdown: { yes: 12, no: 8 },
      };
      const mockResponse = createMockApiResponse(mockAnalytics);

      (
        apiClient.threads.messages.polls.getPollAnalytics as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.polls.getPollAnalytics(
        householdId,
        threadId,
        messageId,
        pollId
      );

      // Assert
      assertApiSuccess(result);
      expect(result.data.totalVotes).toBeDefined();
      expect(result.data.optionBreakdown).toBeDefined();
    });
  });
});
