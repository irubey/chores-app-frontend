import { apiClient } from "@/lib/api/apiClient";
import { createMockApiResponse } from "../../helpers/mocks/apiMocks";
import { setupMessageWithAttachmentsScenario } from "../../helpers/scenarios/messages/attachmentScenarios";
import {
  assertApiSuccess,
  assertAttachmentResponse,
} from "../../helpers/assertions/apiAssertions";
import { createMockAttachment } from "../../helpers/factories/messages/attachmentFactory";
import { createMockMessageWithDetails } from "../../helpers/factories/messages/messageFactory";
import { testLogger } from "../../helpers/utils/testLogger";

jest.mock("@/lib/api/apiClient");

describe("Message Attachment Service", () => {
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

  describe("attachments", () => {
    it("adds an attachment", async () => {
      // Arrange
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const mockAttachment = createMockAttachment(messageId);
      const mockResponse = createMockApiResponse(mockAttachment);

      (
        apiClient.threads.messages.attachments.addAttachment as jest.Mock
      ).mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.threads.messages.attachments.addAttachment(
        householdId,
        threadId,
        messageId,
        file
      );

      // Assert
      assertApiSuccess(result);
      assertAttachmentResponse(result.data);
      expect(result.data.fileType).toBe(file.type);
    });

    it("gets message attachments", async () => {
      // Arrange
      const { message, attachments, response } =
        await setupMessageWithAttachmentsScenario({
          attachmentCount: 2,
        });

      (
        apiClient.threads.messages.attachments.getAttachments as jest.Mock
      ).mockResolvedValue(response);

      // Act
      const result =
        await apiClient.threads.messages.attachments.getAttachments(
          householdId,
          threadId,
          messageId
        );

      // Assert
      assertApiSuccess(result);
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach(assertAttachmentResponse);
      expect(result.data).toHaveLength(attachments.length);
    });

    // Add more attachment-related tests as needed
  });
});
