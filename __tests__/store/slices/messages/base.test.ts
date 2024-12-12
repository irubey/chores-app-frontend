// 1. First, mock the API client before any imports
jest.mock("@/lib/api/apiClient", () => ({
  apiClient: {
    threads: {
      messages: {
        getMessages: jest.fn(),
        createMessage: jest.fn(),
        updateMessage: jest.fn(),
        deleteMessage: jest.fn(),
        markAsRead: jest.fn(),
        readStatus: {
          getReadStatus: jest.fn(),
        },
        getMessageReadStatus: jest.fn(),
      },
    },
  },
}));

// 2. Import helpers and factories
import {
  createMockMessageWithDetails,
  createMockReadStatus,
  createMockMessageDTO,
} from "../../../helpers/factories/messages/messageFactory";
import { setupMessageListScenario } from "../../../helpers/scenarios/messages/messageScenarios";
import { createMockApiResponse } from "../../../helpers/mocks/apiMocks";
import {
  assertApiSuccess,
  assertPaginationResponse,
} from "../../../helpers/assertions/apiAssertions";
import {
  assertLoadingState,
  assertMessageState,
  assertPaginationState,
  assertErrorState,
  assertInitialState,
  assertCompleteMessageState,
  assertSelectedState,
} from "../../../helpers/assertions/stateAssertions";
import { createInitialState } from "../../../helpers/utils/testUtils";
import { createTestStoreWithMocks } from "../../../helpers/setup/testStore";
import { testLogger } from "../../../helpers/utils/testLogger";
import "../../../helpers/matchers/customMatchers";

// 3. Import slice and types
import messagesReducer, {
  fetchMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  resetMessages,
  selectMessage,
  clearError,
  selectMessages,
  selectSelectedMessage,
  selectMessageStatus,
  selectMessageError,
  selectHasMore,
  selectNextCursor,
  markMessageAsRead,
  getMessageReadStatus,
} from "@/store/slices/messagesSlice";
import { MessageWithDetails } from "@shared/types";
import { ApiError, ApiErrorType } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/apiClient";

describe("Messages Slice - Base Operations", () => {
  let store: ReturnType<typeof createTestStoreWithMocks>;

  beforeEach(() => {
    testLogger.clearSpies();
    store = createTestStoreWithMocks({
      mockReducers: {
        auth: true,
        threads: true,
        finances: true,
        chores: true,
        calendar: true,
        notifications: true,
        household: true,
      },
      preloadedState: createInitialState(),
    });
    jest.clearAllMocks();
  });

  const setupStoreWithMessages = (messages: MessageWithDetails[]) => {
    store = createTestStoreWithMocks({
      preloadedState: {
        messages: {
          ...createInitialState().messages,
          messages,
        },
      },
      mockReducers: {
        auth: true,
        threads: true,
        finances: true,
        chores: true,
        calendar: true,
        notifications: true,
        household: true,
      },
    });
    return store;
  };

  describe("Initial State", () => {
    it("should have the correct initial state", () => {
      testLogger.debug("Testing initial state");
      assertInitialState(store.getState(), "messages");
    });
  });

  describe("Sync Actions", () => {
    it("should handle resetMessages", () => {
      const message = createMockMessageWithDetails();
      setupStoreWithMessages([message]);

      testLogger.debug("Testing reset messages", { message });
      store.dispatch(resetMessages());

      assertInitialState(store.getState(), "messages");
    });

    it("should handle selectMessage", () => {
      const message = createMockMessageWithDetails();
      testLogger.debug("Testing select message", { message });

      store.dispatch(selectMessage(message));
      assertSelectedState(store.getState(), "messages", message);
    });

    it("should handle clearError", () => {
      store = createTestStoreWithMocks({
        preloadedState: {
          messages: {
            ...createInitialState().messages,
            error: "Test error",
          },
        },
        mockReducers: {
          auth: true,
          threads: true,
          finances: true,
          chores: true,
          calendar: true,
          notifications: true,
          household: true,
        },
      });

      testLogger.debug("Testing clear error");
      store.dispatch(clearError());
      assertErrorState(store.getState(), "messages", null);
    });
  });

  describe("Message Operations", () => {
    it("should handle successful message fetch", async () => {
      const { messages, response } = setupMessageListScenario(3);
      testLogger.debug("Testing message fetch", { messages });

      (apiClient.threads.messages.getMessages as jest.Mock).mockResolvedValue(
        response
      );

      await store.dispatch(
        fetchMessages({
          householdId: "household-1",
          threadId: "thread-1",
        })
      );

      expect(response).toBeValidApiResponse();
      expect(response).toHaveValidPagination({ hasMore: false });
      expect(store.getState().messages.status.list).toBeInSliceState(
        "succeeded"
      );
      assertCompleteMessageState(
        store.getState(),
        "succeeded",
        "list",
        messages
      );
      testLogger.assertAPIResponseLogged(200);
    });

    it("should handle message creation", async () => {
      const message = createMockMessageWithDetails();
      const response = createMockApiResponse(message);

      (apiClient.threads.messages.createMessage as jest.Mock).mockResolvedValue(
        response
      );

      testLogger.debug("Creating message", { message });

      await store.dispatch(
        createMessage({
          householdId: "household-1",
          threadId: "thread-1",
          messageData: createMockMessageDTO(),
        })
      );

      assertMessageState(store.getState(), "succeeded", "create");
      assertApiSuccess(response);
      expect(store.getState().messages.messages[0]).toEqual(message);
      expect(store.getState().messages.error).toBeNull();
    });

    it("should handle message update", async () => {
      const originalMessage = createMockMessageWithDetails();
      const updatedMessage = { ...originalMessage, content: "Updated content" };
      const response = createMockApiResponse(updatedMessage);

      setupStoreWithMessages([originalMessage]);

      (apiClient.threads.messages.updateMessage as jest.Mock).mockResolvedValue(
        response
      );

      await store.dispatch(
        updateMessage({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: originalMessage.id,
          messageData: { content: "Updated content" },
        })
      );

      assertMessageState(store.getState(), "succeeded", "update");
      assertApiSuccess(response);
      expect(store.getState().messages.messages[0].content).toBe(
        "Updated content"
      );
    });

    it("should handle message deletion", async () => {
      const message = createMockMessageWithDetails();
      const response = createMockApiResponse(undefined);
      setupStoreWithMessages([message]);

      (apiClient.threads.messages.deleteMessage as jest.Mock).mockResolvedValue(
        response
      );

      await store.dispatch(
        deleteMessage({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
        })
      );

      assertLoadingState(store.getState(), "messages", "delete", "succeeded");
      assertApiSuccess(response);
      expect(store.getState().messages.messages).toHaveLength(0);
    });

    it("should handle marking message as read", async () => {
      const message = createMockMessageWithDetails();
      const readStatus = createMockReadStatus(message.id);
      const response = createMockApiResponse({
        messageRead: readStatus,
        messageId: message.id,
      });
      setupStoreWithMessages([message]);

      (apiClient.threads.messages.markAsRead as jest.Mock).mockResolvedValue(
        response
      );

      await store.dispatch(
        markMessageAsRead({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
        })
      );

      assertLoadingState(store.getState(), "messages", "read", "succeeded");
      assertApiSuccess(response);
      expect(store.getState().messages.messages[0].reads).toContainEqual(
        expect.objectContaining({ id: readStatus.id })
      );
    });

    it("should handle API validation errors", async () => {
      const error = new ApiError(
        "Invalid message",
        ApiErrorType.VALIDATION,
        400,
        {
          validationErrors: {
            content: ["Content is required"],
          },
        }
      );

      testLogger.debug("Testing validation error", { error });
      (apiClient.threads.messages.createMessage as jest.Mock).mockRejectedValue(
        error
      );

      await store.dispatch(
        createMessage({
          householdId: "household-1",
          threadId: "thread-1",
          messageData: createMockMessageDTO({ content: "" }),
        })
      );

      expect(error).toHaveErrorType(ApiErrorType.VALIDATION);
      expect(store.getState().messages.status.create).toBeInSliceState(
        "failed"
      );
      testLogger.assertAPIErrorLogged(ApiErrorType.VALIDATION);
    });
  });

  describe("Read Status Operations", () => {
    it("should handle getting message read status", async () => {
      const message = createMockMessageWithDetails();
      const readStatus = createMockReadStatus(message.id);
      const response = createMockApiResponse(readStatus);

      setupStoreWithMessages([message]);
      testLogger.debug("Testing get read status", { message, readStatus });

      (
        apiClient.threads.messages.readStatus.getReadStatus as jest.Mock
      ).mockResolvedValue(response);

      await store.dispatch(
        getMessageReadStatus({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
        })
      );

      const state = store.getState();
      assertMessageState(state, "succeeded", "read");
      assertApiSuccess(response);
    });
  });

  describe("Selectors", () => {
    it("should select messages", () => {
      const messages = [createMockMessageWithDetails()];
      setupStoreWithMessages(messages);

      testLogger.debug("Testing message selector", { messages });
      expect(store.getState().messages.messages).toEqual(messages);
    });

    it("should select selected message", () => {
      const message = createMockMessageWithDetails();
      store.dispatch(selectMessage(message));

      testLogger.debug("Testing selected message selector", { message });
      expect(store.getState().messages.selectedMessage).toEqual(message);
    });

    it("should select message status", () => {
      const state = store.getState();
      testLogger.debug("Testing message status selector", {
        status: state.messages.status,
      });
      assertMessageState(state, "idle", "list");
    });

    it("should select pagination info", () => {
      const state = store.getState();
      testLogger.debug("Testing pagination selector", {
        hasMore: state.messages.hasMore,
        nextCursor: state.messages.nextCursor,
      });
      assertPaginationState(state, "messages", false);
    });
  });

  describe("State Management", () => {
    it("should handle initial state", () => {
      testLogger.debug("Testing initial state");
      assertInitialState(store.getState(), "messages");
    });

    it("should handle state reset", () => {
      const messages = [createMockMessageWithDetails()];
      setupStoreWithMessages(messages);

      testLogger.debug("Testing state reset");
      store.dispatch(resetMessages());
      assertInitialState(store.getState(), "messages");
    });

    it("should handle error clearing", () => {
      const state = store.getState();
      store.dispatch(clearError());

      testLogger.debug("Testing error clearing");
      assertErrorState(state, "messages", null);
    });
  });

  describe("Read Status Operations", () => {
    it("should handle marking message as read", async () => {
      const message = createMockMessageWithDetails();
      const readStatus = createMockReadStatus(message.id);
      const response = createMockApiResponse({
        messageRead: readStatus,
        messageId: message.id,
      });

      setupStoreWithMessages([message]);
      testLogger.debug("Testing mark as read", { message, readStatus });

      (apiClient.threads.messages.markAsRead as jest.Mock).mockResolvedValue(
        response
      );

      await store.dispatch(
        markMessageAsRead({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
        })
      );

      const state = store.getState();
      assertCompleteMessageState(state, "succeeded", "read", [
        { ...message, reads: [readStatus] },
      ]);
      assertApiSuccess(response);
    });

    it("should handle getting message read status", async () => {
      const message = createMockMessageWithDetails();
      const readStatus = createMockReadStatus(message.id);
      const response = createMockApiResponse(readStatus);

      setupStoreWithMessages([message]);
      testLogger.debug("Testing get read status", { message, readStatus });

      (
        apiClient.threads.messages.readStatus.getReadStatus as jest.Mock
      ).mockResolvedValue(response);

      await store.dispatch(
        getMessageReadStatus({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
        })
      );

      const state = store.getState();
      assertCompleteMessageState(state, "succeeded", "read", [
        { ...message, reads: [readStatus] },
      ]);
      assertApiSuccess(response);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle concurrent operations with state transitions", async () => {
      const message = createMockMessageWithDetails();
      const updatedMessage = { ...message, content: "Updated" };

      testLogger.debug("Testing concurrent operations with state transitions", {
        original: message,
        updated: updatedMessage,
      });

      setupStoreWithMessages([message]);

      // Start multiple operations
      const updatePromise = store.dispatch(
        updateMessage({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          messageData: { content: "Updated" },
        })
      );

      const readPromise = store.dispatch(
        markMessageAsRead({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
        })
      );

      await Promise.all([updatePromise, readPromise]);

      const state = store.getState();
      assertMessageState(state, "succeeded", "update");
      assertMessageState(state, "succeeded", "read");
      assertErrorState(state, "messages", null);
    });
  });

  describe("Error Handling", () => {
    it("should handle API validation errors", async () => {
      const error = new ApiError(
        "Invalid message",
        ApiErrorType.VALIDATION,
        400,
        {
          validationErrors: {
            content: ["Content is required"],
          },
        }
      );

      testLogger.debug("Testing validation error", { error });
      (apiClient.threads.messages.createMessage as jest.Mock).mockRejectedValue(
        error
      );

      await store.dispatch(
        createMessage({
          householdId: "household-1",
          threadId: "thread-1",
          messageData: createMockMessageDTO({ content: "" }),
        })
      );

      const state = store.getState();
      assertCompleteMessageState(
        state,
        "failed",
        "create",
        [],
        "Invalid message"
      );
    });

    it("should handle network errors", async () => {
      const error = new ApiError("Network error", ApiErrorType.NETWORK, 0);
      (apiClient.threads.messages.getMessages as jest.Mock).mockRejectedValue(
        error
      );

      await store.dispatch(
        fetchMessages({
          householdId: "household-1",
          threadId: "thread-1",
        })
      );

      assertLoadingState(store.getState(), "messages", "list", "failed");
      expect(store.getState().messages.error).toBe("Failed to fetch messages");
    });
  });

  describe("Pagination", () => {
    it("should handle subsequent page fetches", async () => {
      const firstPage = setupMessageListScenario(3, true, "page-2");
      testLogger.debug("Testing first page fetch", { firstPage });

      (
        apiClient.threads.messages.getMessages as jest.Mock
      ).mockResolvedValueOnce(firstPage.response);

      const firstResponse = await store.dispatch(
        fetchMessages({
          householdId: "household-1",
          threadId: "thread-1",
        })
      );

      expect(firstPage.response).toBeValidApiResponse();
      expect(firstPage.response).toHaveValidPagination({
        hasMore: true,
        cursor: "page-2",
      });
      testLogger.assertAPIResponseLogged(200);

      // Second page
      const secondPage = setupMessageListScenario(2, true, "page-3");
      testLogger.debug("Testing second page fetch", { secondPage });

      (
        apiClient.threads.messages.getMessages as jest.Mock
      ).mockResolvedValueOnce(secondPage.response);

      const secondResponse = await store.dispatch(
        fetchMessages({
          householdId: "household-1",
          threadId: "thread-1",
          options: { cursor: "page-2" },
        })
      );

      expect(secondPage.response).toBeValidApiResponse();
      expect(secondPage.response).toHaveValidPagination({
        hasMore: true,
        cursor: "page-3",
      });
      assertCompleteMessageState(
        store.getState(),
        "succeeded",
        "list",
        [...firstPage.messages, ...secondPage.messages],
        null,
        true,
        "page-3"
      );
    });

    it("should maintain pagination state during error recovery", async () => {
      // First successful page
      const firstPage = setupMessageListScenario(3, true, "next-cursor");
      testLogger.debug("Testing pagination error recovery - first page", {
        firstPage,
      });

      (
        apiClient.threads.messages.getMessages as jest.Mock
      ).mockResolvedValueOnce(firstPage.response);

      await store.dispatch(
        fetchMessages({
          householdId: "household-1",
          threadId: "thread-1",
        })
      );

      // Failed request
      const error = new ApiError("Network error", ApiErrorType.NETWORK, 500);
      testLogger.debug("Testing pagination error recovery - error", { error });

      (
        apiClient.threads.messages.getMessages as jest.Mock
      ).mockRejectedValueOnce(error);

      await store.dispatch(
        fetchMessages({
          householdId: "household-1",
          threadId: "thread-1",
          options: { cursor: "next-cursor" },
        })
      );

      const state = store.getState();
      assertCompleteMessageState(
        state,
        "failed",
        "list",
        firstPage.messages,
        "Network error",
        true,
        "next-cursor"
      );
    });
  });
});
