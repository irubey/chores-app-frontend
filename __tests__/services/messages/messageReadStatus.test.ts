import { apiClient } from "@/lib/api/apiClient";
import { createMockApiResponse } from "../../helpers/mocks/apiMocks";
import { assertApiSuccess } from "../../helpers/assertions/apiAssertions";
import { createMockMessageWithDetails } from "../../helpers/factories/messages/messageFactory";
import { createMockReadStatus } from "../../helpers/factories/messages/messageFactory";
import { testLogger } from "../../helpers/utils/testLogger";

jest.mock("@/lib/api/apiClient");

describe("Message Read Status Service", () => {
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

  describe("message read status", () => {
    it("marks a message as read", async () => {
      // Arrange
      const mockReadStatus = createMockReadStatus(messageId);
      const mockResponse = createMockApiResponse(mockReadStatus);

      (apiClient.threads.messages.markAsRead as jest.Mock).mockResolvedValue(
        mockResponse
      );

      // Act
      const result = await apiClient.threads.messages.markAsRead(
        householdId,
        threadId,
        messageId
      );

      // Assert
      assertApiSuccess(result);
      expect(result.data.messageId).toBe(messageId);
      expect(result.data.readAt).toBeDefined();
      expect(result.data.user).toBeDefined();
    });

    it("gets message read status", async () => {
      // Arrange
      const mockReadStatus = {
        messageId,
        readBy: [{ userId: "user-1", readAt: new Date() }],
        unreadBy: ["user-2", "user-3"],
      };
      const mockResponse = createMockApiResponse(mockReadStatus);

      (
        apiClient.threads.messages.getMessageReadStatus as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.getMessageReadStatus(
        householdId,
        threadId,
        messageId
      );

      // Assert
      assertApiSuccess(result);
      expect(result.data.messageId).toBe(messageId);
      expect(result.data.readBy.length).toBeGreaterThan(0);
      expect(result.data.unreadBy.length).toBeGreaterThan(0);
    });
  });
});
