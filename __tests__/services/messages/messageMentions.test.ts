import { apiClient } from "@/lib/api/apiClient";
import { createMockApiResponse } from "../../helpers/mocks/apiMocks";
import { setupMessageWithMentionsScenario } from "../../helpers/scenarios/messages/mentionScenarios";
import {
  assertApiSuccess,
  assertMessageWithDetailsResponse,
} from "../../helpers/assertions/apiAssertions";
import { createMockMessageWithDetails } from "../../helpers/factories/messages/messageFactory";
import {
  createMockMention,
  createMockMentionDTO,
} from "../../helpers/factories/messages/mentionFactory";
import { testLogger } from "../../helpers/utils/testLogger";

jest.mock("@/lib/api/apiClient");

describe("Message Mentions Service", () => {
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

  describe("mentions", () => {
    it("creates a mention", async () => {
      // Arrange
      const mentionData = createMockMentionDTO();
      const mockMention = createMockMention(messageId, {
        userId: mentionData.userId,
      });
      const mockResponse = createMockApiResponse(mockMention);

      (
        apiClient.threads.messages.mentions.createMention as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.mentions.createMention(
        householdId,
        threadId,
        messageId,
        mentionData
      );

      // Assert
      assertApiSuccess(result);
      expect(result.data.userId).toBe(mentionData.userId);
      expect(result.data.user).toBeDefined();
    });

    it("gets message mentions", async () => {
      // Arrange
      const { message, mentions, response } =
        await setupMessageWithMentionsScenario({
          mentionCount: 2,
        });

      (
        apiClient.threads.messages.mentions.getMessageMentions as jest.Mock
      ).mockResolvedValue(response);

      // Act
      const result =
        await apiClient.threads.messages.mentions.getMessageMentions(
          householdId,
          threadId,
          messageId
        );

      // Assert
      assertApiSuccess(result);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(mentions.length);
      result.data.forEach((mention) => {
        expect(mention.messageId).toBe(messageId);
        expect(mention.user).toBeDefined();
      });
    });

    it("deletes a mention", async () => {
      // Arrange
      const mentionId = "mention-1";
      const mockResponse = createMockApiResponse<void>(undefined);

      (
        apiClient.threads.messages.mentions.deleteMention as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.mentions.deleteMention(
        householdId,
        threadId,
        messageId,
        mentionId
      );

      // Assert
      assertApiSuccess(result);
      expect(result.data).toBeUndefined();
    });

    it("gets unread mentions count", async () => {
      // Arrange
      const mockResponse = createMockApiResponse(5);

      (
        apiClient.threads.messages.mentions.getUnreadMentionsCount as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result =
        await apiClient.threads.messages.mentions.getUnreadMentionsCount(
          householdId
        );

      // Assert
      assertApiSuccess(result);
      expect(typeof result.data).toBe("number");
      expect(result.data).toBeGreaterThanOrEqual(0);
    });
  });
});
