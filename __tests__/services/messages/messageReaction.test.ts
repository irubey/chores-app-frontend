import { apiClient } from "@/lib/api/apiClient";
import { createMockApiResponse } from "../../helpers/mocks/apiMocks";
import { setupMessageWithReactionsScenario } from "../../helpers/scenarios/messages/reactionScenarios";
import {
  assertApiSuccess,
  assertReactionResponse,
} from "../../helpers/assertions/apiAssertions";
import { createMockMessageWithDetails } from "../../helpers/factories/messages/messageFactory";
import {
  createMockReaction,
  createMockReactionDTO,
} from "../../helpers/factories/messages/reactionFactory";
import { testLogger } from "../../helpers/utils/testLogger";
import { ReactionType } from "@shared/enums";

jest.mock("@/lib/api/apiClient");

describe("Message Reaction Service", () => {
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

  describe("reactions", () => {
    it("adds a reaction", async () => {
      // Arrange
      const reactionDTO = createMockReactionDTO();
      const mockReaction = createMockReaction(messageId);
      const mockResponse = createMockApiResponse(mockReaction);

      (
        apiClient.threads.messages.reactions.addReaction as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.reactions.addReaction(
        householdId,
        threadId,
        messageId,
        reactionDTO
      );

      // Assert
      assertApiSuccess(result);
      assertReactionResponse(result.data);
      expect(result.data.type).toBe(reactionDTO.type);
    });

    it("removes a reaction", async () => {
      // Arrange
      const reactionId = "reaction-1";
      const mockResponse = createMockApiResponse<void>(undefined);

      (
        apiClient.threads.messages.reactions.removeReaction as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.reactions.removeReaction(
        householdId,
        threadId,
        messageId,
        reactionId
      );

      // Assert
      assertApiSuccess(result);
      expect(result.data).toBeUndefined();
    });

    it("gets message reactions", async () => {
      // Arrange
      const { message, reactions, response } =
        await setupMessageWithReactionsScenario({
          reactionCount: 2,
        });

      (
        apiClient.threads.messages.reactions.getReactions as jest.Mock
      ).mockResolvedValue(response);

      // Act
      const result = await apiClient.threads.messages.reactions.getReactions(
        householdId,
        threadId,
        messageId
      );

      // Assert
      assertApiSuccess(result);
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach(assertReactionResponse);
      expect(result.data).toHaveLength(reactions.length);
    });

    it("gets reaction analytics", async () => {
      // Arrange
      const mockAnalytics = {
        like: 10,
        love: 5,
        haha: 2,
      };
      const mockResponse = createMockApiResponse(mockAnalytics);

      (
        apiClient.threads.messages.reactions.getReactionAnalytics as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result =
        await apiClient.threads.messages.reactions.getReactionAnalytics(
          householdId,
          threadId,
          messageId
        );

      // Assert
      assertApiSuccess(result);
      expect(result.data[ReactionType.LIKE]).toBeDefined();
      expect(result.data[ReactionType.LOVE]).toBeDefined();
      expect(result.data[ReactionType.HAHA]).toBeDefined();
    });
  });
});
