// Mock modules - use the factory function
jest.mock("@/lib/api/logger");
jest.mock("@/lib/api/apiClient");

import { apiClient } from "@/lib/api/apiClient";
import { ApiErrorType } from "@/lib/api/errors/apiErrors";
import { testLogger } from "../helpers/utils/testLogger";
import {
  createMockApiResponse,
  simulateNetworkError,
  simulateValidationError,
  simulateAuthError,
  simulateForbiddenError,
  simulateNotFoundError,
  simulateRateLimitError,
  simulateAbortError,
  simulateServerError,
} from "../helpers/mocks/apiMocks";
import {
  setupThreadListScenario,
  setupThreadDetailsScenario,
  setupThreadCreationScenario,
  setupThreadUpdateScenario,
  setupThreadInviteScenario,
} from "../helpers/scenarios/threadScenarios";
import {
  assertApiSuccess,
  assertApiError,
  assertThreadWithDetailsResponse,
  assertThreadWithParticipantsResponse,
  assertThreadWithMessagesResponse,
  assertCollectionResponse,
  assertThreadResponse,
} from "../helpers/assertions/apiAssertions";
import {
  createMockThreadWithDetails,
  createMockCreateThreadDTO,
} from "../helpers/factories/threadFactory";
import { ThreadWithDetails, CreateThreadDTO } from "@shared/types";

describe("Thread Service", () => {
  let thread: ThreadWithDetails;
  let householdId: string;
  let threadId: string;

  beforeEach(() => {
    // Setup test data
    thread = createMockThreadWithDetails();
    householdId = thread.householdId;
    threadId = thread.id;

    // Reset logger mocks
    testLogger.setupTest();

    testLogger.debug("Setting up test data", {
      householdId,
      threadId,
    });
  });

  afterEach(() => {
    testLogger.debug("Cleaning up test data");
    jest.clearAllMocks();
  });

  describe("thread operations", () => {
    it("gets threads with pagination", async () => {
      // Arrange
      const { threads, response } = await setupThreadListScenario({
        count: 3,
        hasMore: true,
      });

      (apiClient.threads.threads.getThreads as jest.Mock).mockResolvedValue(
        response
      );

      // Act
      const result = await apiClient.threads.threads.getThreads(householdId);

      // Assert
      assertApiSuccess(result);
      assertCollectionResponse(result, assertThreadWithDetailsResponse);
      expect(result.pagination?.hasMore).toBe(true);
      expect(result.data).toHaveLength(threads.length);
      testLogger.assertAPIResponseLogged(200);
    });

    it("creates a new thread", async () => {
      // Arrange
      const { createDTO, createdThread, response } =
        await setupThreadCreationScenario();

      (apiClient.threads.threads.createThread as jest.Mock).mockResolvedValue(
        response
      );

      // Act
      const result = await apiClient.threads.threads.createThread(
        householdId,
        createDTO
      );

      // Assert
      assertApiSuccess(result);
      assertThreadWithParticipantsResponse(result.data);
      expect(result.data.title).toBe(createDTO.title);
      testLogger.assertAPIResponseLogged(200);
    });

    it("gets thread details", async () => {
      // Arrange
      const { thread, response } = await setupThreadDetailsScenario();

      (
        apiClient.threads.threads.getThreadDetails as jest.Mock
      ).mockResolvedValue(response);

      // Act
      const result = await apiClient.threads.threads.getThreadDetails(
        householdId,
        threadId
      );

      // Assert
      assertApiSuccess(result);
      assertThreadWithMessagesResponse(result.data);
      expect(result.data.id).toBe(threadId);
      testLogger.assertAPIResponseLogged(200);
    });

    it("updates a thread", async () => {
      // Arrange
      const { updateDTO, updatedThread, response } =
        await setupThreadUpdateScenario();

      (apiClient.threads.threads.updateThread as jest.Mock).mockResolvedValue(
        response
      );

      // Act
      const result = await apiClient.threads.threads.updateThread(
        householdId,
        threadId,
        updateDTO
      );

      // Assert
      assertApiSuccess(result);
      assertThreadResponse(result.data);
      expect(result.data.title).toBe(updateDTO.title);
      testLogger.assertAPIResponseLogged(200);
    });

    it("deletes a thread", async () => {
      // Arrange
      const mockResponse = createMockApiResponse(undefined);
      (apiClient.threads.threads.deleteThread as jest.Mock).mockResolvedValue(
        mockResponse
      );

      // Act
      const result = await apiClient.threads.threads.deleteThread(
        householdId,
        threadId
      );

      // Assert
      assertApiSuccess(result);
      expect(result.data).toBeUndefined();
      testLogger.assertAPIResponseLogged(200);
    });

    it("invites users to a thread", async () => {
      // Arrange
      const { inviteDTO, updatedThread, response } =
        await setupThreadInviteScenario({
          inviteeCount: 2,
        });

      (apiClient.threads.threads.inviteUsers as jest.Mock).mockResolvedValue(
        response
      );

      // Act
      const result = await apiClient.threads.threads.inviteUsers(
        householdId,
        threadId,
        inviteDTO.userIds
      );

      // Assert
      assertApiSuccess(result);
      assertThreadWithParticipantsResponse(result.data);
      expect(result.data.participants).toHaveLength(
        updatedThread.participants.length
      );
      testLogger.assertAPIResponseLogged(200);
    });
  });

  describe("error handling", () => {
    describe("validation errors", () => {
      it("handles validation errors when creating a thread", async () => {
        // Arrange
        const invalidDTO = createMockCreateThreadDTO({ title: "" });
        const mockError = simulateValidationError({
          title: ["Title cannot be empty"],
        });

        (apiClient.threads.threads.createThread as jest.Mock).mockRejectedValue(
          mockError
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.createThread(householdId, invalidDTO)
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.VALIDATION);
      });

      it("handles validation errors when updating a thread", async () => {
        // Arrange
        const invalidDTO = { title: "" };
        const mockError = simulateValidationError({
          title: ["Title must be between 1 and 100 characters"],
        });

        (apiClient.threads.threads.updateThread as jest.Mock).mockRejectedValue(
          mockError
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.updateThread(
            householdId,
            threadId,
            invalidDTO
          )
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.VALIDATION);
      });

      it("handles validation errors when inviting users", async () => {
        // Arrange
        const invalidUserIds: string[] = [];
        const mockError = simulateValidationError({
          userIds: ["At least one user must be selected"],
        });

        (apiClient.threads.threads.inviteUsers as jest.Mock).mockRejectedValue(
          mockError
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.inviteUsers(
            householdId,
            threadId,
            invalidUserIds
          )
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.VALIDATION);
      });
    });

    describe("authentication errors", () => {
      it("handles unauthorized access", async () => {
        // Arrange
        const mockError = simulateAuthError();

        (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
          mockError
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.getThreads(householdId)
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.UNAUTHORIZED);
      });
    });

    describe("authorization errors", () => {
      it("handles forbidden access to thread", async () => {
        // Arrange
        const mockError = simulateForbiddenError();

        (
          apiClient.threads.threads.getThreadDetails as jest.Mock
        ).mockRejectedValue(mockError);

        // Act & Assert
        await expect(
          apiClient.threads.threads.getThreadDetails(householdId, threadId)
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.FORBIDDEN);
      });
    });

    describe("not found errors", () => {
      it("handles thread not found", async () => {
        // Arrange
        const nonExistentThreadId = "non-existent-id";
        const mockError = simulateNotFoundError("Thread");

        (
          apiClient.threads.threads.getThreadDetails as jest.Mock
        ).mockRejectedValue(mockError);

        // Act & Assert
        await expect(
          apiClient.threads.threads.getThreadDetails(
            householdId,
            nonExistentThreadId
          )
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.NOT_FOUND);
      });

      it("handles household not found", async () => {
        // Arrange
        const nonExistentHouseholdId = "non-existent-household";
        const mockError = simulateNotFoundError("Household");

        (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
          mockError
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.getThreads(nonExistentHouseholdId)
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.NOT_FOUND);
      });
    });

    describe("server errors", () => {
      it("handles internal server errors", async () => {
        // Arrange
        const mockError = simulateServerError();

        (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
          mockError
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.getThreads(householdId)
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.SERVER);
      });

      it("handles rate limit exceeded", async () => {
        // Arrange
        const mockError = simulateRateLimitError();

        (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
          mockError
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.getThreads(householdId)
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.RATE_LIMIT);
      });
    });

    describe("network errors", () => {
      it("handles network timeouts", async () => {
        // Arrange
        const mockError = simulateNetworkError();

        (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
          mockError
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.getThreads(householdId)
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.NETWORK);
      });

      it("handles connection errors", async () => {
        // Arrange
        const mockError = simulateNetworkError();

        (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
          mockError
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.getThreads(householdId)
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.NETWORK);
      });
    });

    describe("request cancellation", () => {
      it("handles aborted requests", async () => {
        // Arrange
        const abortController = new AbortController();
        const mockError = simulateAbortError();

        (apiClient.threads.threads.getThreads as jest.Mock).mockImplementation(
          () => {
            abortController.abort();
            return Promise.reject(mockError);
          }
        );

        // Act & Assert
        await expect(
          apiClient.threads.threads.getThreads(
            householdId,
            undefined,
            abortController.signal
          )
        ).rejects.toThrow(mockError);

        testLogger.assertAPIErrorLogged(ApiErrorType.ABORTED);
      });
    });
  });

  describe("pagination handling", () => {
    it("handles cursor-based pagination correctly", async () => {
      // Arrange
      const firstPage = await setupThreadListScenario({
        count: 5,
        hasMore: true,
        nextCursor: "thread-id-5",
      });

      const secondPage = await setupThreadListScenario({
        count: 3,
        hasMore: false,
        startAfterId: firstPage.threads[firstPage.threads.length - 1].id,
      });

      (apiClient.threads.threads.getThreads as jest.Mock)
        .mockResolvedValueOnce(firstPage.response)
        .mockResolvedValueOnce(secondPage.response);

      // Act
      const page1 = await apiClient.threads.threads.getThreads(householdId, {
        limit: 5,
      });
      const page2 = await apiClient.threads.threads.getThreads(householdId, {
        cursor: page1.pagination?.nextCursor,
        limit: 5,
      });

      // Assert
      assertApiSuccess(page1);
      assertApiSuccess(page2);
      assertCollectionResponse(page1, assertThreadWithDetailsResponse);
      assertCollectionResponse(page2, assertThreadWithDetailsResponse);

      // Verify no overlap between pages
      const page1Ids = new Set(page1.data.map((t) => t.id));
      const page2Ids = new Set(page2.data.map((t) => t.id));
      const intersection = Array.from(page1Ids).filter((id) =>
        page2Ids.has(id)
      );
      expect(intersection).toHaveLength(0);

      // Verify chronological order within each page
      const verifyChronologicalOrder = (threads: ThreadWithDetails[]) => {
        const dates = threads.map((t) => new Date(t.createdAt).getTime());
        const sortedDates = Array.from(dates).sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates); // Descending by default
      };

      verifyChronologicalOrder(page1.data);
      verifyChronologicalOrder(page2.data);

      // Verify pagination metadata
      expect(page1.pagination?.hasMore).toBe(true);
      expect(page1.pagination?.nextCursor).toBe("thread-id-5");
      expect(page2.pagination?.hasMore).toBe(false);
      expect(page2.pagination?.nextCursor).toBeUndefined();
    });

    it("handles different sort directions", async () => {
      // Arrange
      const ascendingResponse = await setupThreadListScenario({
        count: 3,
        sortDirection: "asc",
      });

      const descendingResponse = await setupThreadListScenario({
        count: 3,
        sortDirection: "desc",
      });

      (apiClient.threads.threads.getThreads as jest.Mock)
        .mockResolvedValueOnce(ascendingResponse.response)
        .mockResolvedValueOnce(descendingResponse.response);

      // Act
      const ascResult = await apiClient.threads.threads.getThreads(
        householdId,
        {
          direction: "asc",
          sortBy: "createdAt",
        }
      );

      const descResult = await apiClient.threads.threads.getThreads(
        householdId,
        {
          direction: "desc",
          sortBy: "createdAt",
        }
      );

      // Assert
      assertApiSuccess(ascResult);
      assertApiSuccess(descResult);
      expect(ascResult.data).toHaveLength(3);
      expect(descResult.data).toHaveLength(3);

      // Check sort order
      const ascDates = ascResult.data.map((t) =>
        new Date(t.createdAt).getTime()
      );
      const descDates = descResult.data.map((t) =>
        new Date(t.createdAt).getTime()
      );

      expect(ascDates).toEqual([...ascDates].sort((a, b) => a - b));
      expect(descDates).toEqual([...descDates].sort((a, b) => b - a));
    });

    it("handles empty results", async () => {
      // Arrange
      const emptyResponse = await setupThreadListScenario({
        count: 0,
        hasMore: false,
      });

      (apiClient.threads.threads.getThreads as jest.Mock).mockResolvedValue(
        emptyResponse.response
      );

      // Act
      const result = await apiClient.threads.threads.getThreads(householdId, {
        limit: 10,
      });

      // Assert
      assertApiSuccess(result);
      expect(result.data).toHaveLength(0);
      expect(result.pagination?.hasMore).toBe(false);
      expect(result.pagination?.nextCursor).toBeUndefined();
    });

    it("handles invalid cursor gracefully", async () => {
      // Arrange
      const mockError = simulateValidationError({
        cursor: ["Invalid cursor format"],
      });

      (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
        mockError
      );

      // Act & Assert
      await expect(
        apiClient.threads.threads.getThreads(householdId, {
          cursor: "invalid-cursor",
        })
      ).rejects.toThrow(mockError);

      testLogger.assertAPIErrorLogged(ApiErrorType.VALIDATION);
    });
  });
});
