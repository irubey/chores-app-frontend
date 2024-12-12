import { apiClient } from "@/lib/api/apiClient";
import { ApiErrorType } from "@/lib/api/errors/apiErrors";
import {
  createMockApiResponse,
  simulateNetworkError,
  simulateValidationError,
} from "../../helpers/mocks/apiMocks";
import { setupMessageListScenario } from "../../helpers/scenarios/messages/messageScenarios";
import {
  assertApiSuccess,
  assertApiError,
  assertMessageWithDetailsResponse,
  assertCollectionResponse,
} from "../../helpers/assertions/apiAssertions";
import {
  createMockMessageWithDetails,
  createMockMessageDTO,
} from "../../helpers/factories/messages/messageFactory";
import { testLogger } from "../../helpers/utils/testLogger";
import { MessageWithDetails, CreateMessageDTO } from "@shared/types";

jest.mock("@/lib/api/apiClient");

describe("Message Service", () => {
  let message: MessageWithDetails;
  let householdId: string;
  let threadId: string;
  let messageId: string;

  beforeEach(() => {
    message = createMockMessageWithDetails();
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

  describe("message operations", () => {
    it("gets messages with pagination", async () => {
      // Arrange
      const { messages, response } = await setupMessageListScenario({
        count: 3,
        hasMore: true,
      });

      (apiClient.threads.messages.getMessages as jest.Mock).mockResolvedValue(
        response
      );

      // Act
      const result = await apiClient.threads.messages.getMessages(
        householdId,
        threadId
      );

      // Assert
      assertApiSuccess(result);
      assertCollectionResponse(result, assertMessageWithDetailsResponse);
      expect(result.pagination?.hasMore).toBe(true);
      expect(result.data).toHaveLength(messages.length);
      testLogger.assertAPIResponseLogged(200);
    });

    it("creates a new message", async () => {
      // Arrange
      const createDTO: CreateMessageDTO = createMockMessageDTO();
      const mockResponse = createMockApiResponse(
        createMockMessageWithDetails()
      );

      (apiClient.threads.messages.createMessage as jest.Mock).mockResolvedValue(
        mockResponse
      );

      // Act
      const result = await apiClient.threads.messages.createMessage(
        householdId,
        threadId,
        createDTO
      );

      // Assert
      assertApiSuccess(result);
      assertMessageWithDetailsResponse(result.data);
      expect(result.data.content).toBe(createDTO.content);
      testLogger.assertAPIResponseLogged(200);
    });

    it("updates a message", async () => {
      // Arrange
      const updateContent = "Updated content";
      const updatedMessage = {
        ...message,
        content: updateContent,
      };
      const mockResponse = createMockApiResponse(updatedMessage);

      (apiClient.threads.messages.updateMessage as jest.Mock).mockResolvedValue(
        mockResponse
      );

      // Act
      const result = await apiClient.threads.messages.updateMessage(
        householdId,
        threadId,
        messageId,
        { content: updateContent }
      );

      // Assert
      assertApiSuccess(result);
      assertMessageWithDetailsResponse(result.data);
      expect(result.data.content).toBe(updateContent);
      testLogger.assertAPIResponseLogged(200);
    });

    it("deletes a message", async () => {
      // Arrange
      const mockResponse = createMockApiResponse(undefined);
      (apiClient.threads.messages.deleteMessage as jest.Mock).mockResolvedValue(
        mockResponse
      );

      // Act
      const result = await apiClient.threads.messages.deleteMessage(
        householdId,
        threadId,
        messageId
      );

      // Assert
      assertApiSuccess(result);
      expect(result.data).toBeUndefined();
      testLogger.assertAPIResponseLogged(200);
    });
  });

  describe("error handling", () => {
    it("handles validation errors when creating a message", async () => {
      // Arrange
      const invalidDTO = createMockMessageDTO({ content: "" });
      const mockError = simulateValidationError({
        content: ["Content cannot be empty"],
      });

      (apiClient.threads.messages.createMessage as jest.Mock).mockRejectedValue(
        mockError
      );

      // Act & Assert
      await expect(
        apiClient.threads.messages.createMessage(
          householdId,
          threadId,
          invalidDTO
        )
      ).rejects.toThrow(mockError);

      testLogger.assertAPIErrorLogged(ApiErrorType.VALIDATION);
    });

    it("handles network errors when fetching messages", async () => {
      // Arrange
      const mockError = simulateNetworkError();
      (apiClient.threads.messages.getMessages as jest.Mock).mockRejectedValue(
        mockError
      );

      // Act & Assert
      await expect(
        apiClient.threads.messages.getMessages(householdId, threadId)
      ).rejects.toThrow(mockError);

      testLogger.assertAPIErrorLogged(ApiErrorType.NETWORK);
    });

    it("handles pagination parameters correctly", async () => {
      // Arrange
      const paginationOptions = { cursor: "next-page", limit: 5 };
      const { messages, response } = await setupMessageListScenario({
        count: 5,
        hasMore: true,
      });

      (apiClient.threads.messages.getMessages as jest.Mock).mockResolvedValue(
        response
      );

      // Act
      const result = await apiClient.threads.messages.getMessages(
        householdId,
        threadId,
        paginationOptions
      );

      // Assert
      assertApiSuccess(result);
      expect(result.pagination?.hasMore).toBe(true);
      expect(result.data).toHaveLength(paginationOptions.limit);
      testLogger.assertAPIResponseLogged(200);
    });
  });
});
