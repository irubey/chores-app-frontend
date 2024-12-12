import {
  createMention,
  deleteMention,
  getMessageMentions,
  getUserMentions,
  getUnreadMentionsCount,
} from "@/store/slices/messagesSlice";
import {
  TestStore,
  createTestStoreWithMocks,
} from "../../../helpers/setup/testStore";
import { apiClient } from "@/lib/api/apiClient";
import {
  createMockApiResponse,
  createMockApiClient,
} from "../../../helpers/mocks/apiMocks";
import { MessageWithDetails } from "@shared/types";
import { ApiError, ApiErrorType } from "@/lib/api/errors";
import {
  createMockMessageWithDetails,
  createMockMention,
  createMockMentions,
} from "../../../helpers/factories/messages/messageFactory";
import { setupMessageWithMentionScenario } from "../../../helpers/scenarios/messages/messageScenarios";
import { createInitialState } from "../../../helpers/utils/testUtils";

// Mock the API client
jest.mock("@/lib/api/apiClient", () => ({
  apiClient: createMockApiClient(),
}));

describe("Messages Slice - Mention Operations", () => {
  let store: TestStore;

  beforeEach(() => {
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

  describe("Happy Path", () => {
    it("should handle creating a mention", async () => {
      const { message, mentions } = setupMessageWithMentionScenario(1);
      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.mentions.createMention as jest.Mock
      ).mockResolvedValue(createMockApiResponse(mentions[0]));

      await store.dispatch(
        createMention({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          mentionData: { userId: mentions[0].userId },
        })
      );

      const state = store.getState().messages;
      expect(state.status.mention).toBe("succeeded");
      expect(state.messages[0].mentions).toContainEqual(
        expect.objectContaining({
          userId: mentions[0].userId,
        })
      );
      expect(state.error).toBeNull();
    });

    it("should handle deleting a mention", async () => {
      const { message, mentions } = setupMessageWithMentionScenario(1);
      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.mentions.deleteMention as jest.Mock
      ).mockResolvedValue(createMockApiResponse(undefined));

      await store.dispatch(
        deleteMention({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          mentionId: mentions[0].id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.mention).toBe("succeeded");
      expect(state.messages[0].mentions).toHaveLength(0);
      expect(state.error).toBeNull();
    });

    it("should handle getting message mentions", async () => {
      const { message, mentions } = setupMessageWithMentionScenario(2);

      (
        apiClient.threads.messages.mentions.getMessageMentions as jest.Mock
      ).mockResolvedValue(createMockApiResponse(mentions));

      await store.dispatch(
        getMessageMentions({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.mention).toBe("succeeded");
      expect(state.error).toBeNull();
    });

    it("should handle getting unread mentions count", async () => {
      const expectedCount = 5;

      (
        apiClient.threads.messages.mentions.getUnreadMentionsCount as jest.Mock
      ).mockResolvedValue(createMockApiResponse(expectedCount));

      await store.dispatch(
        getUnreadMentionsCount({
          householdId: "household-1",
        })
      );

      const state = store.getState().messages;
      expect(state.status.mention).toBe("succeeded");
      expect(state.error).toBeNull();
    });

    it("should handle getting user mentions", async () => {
      const { mentions } = setupMessageWithMentionScenario(2);

      (
        apiClient.threads.messages.mentions.getUserMentions as jest.Mock
      ).mockResolvedValue(createMockApiResponse(mentions));

      await store.dispatch(
        getUserMentions({
          householdId: "household-1",
        })
      );

      const state = store.getState().messages;
      expect(state.status.mention).toBe("succeeded");
      expect(state.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors when creating mention", async () => {
      const message = createMockMessageWithDetails();
      setupStoreWithMessages([message]);

      const error = new ApiError(
        "Invalid mention",
        ApiErrorType.VALIDATION,
        400,
        {
          validationErrors: {
            userId: ["User not found in household"],
          },
        }
      );

      (
        apiClient.threads.messages.mentions.createMention as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        createMention({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          mentionData: { userId: "invalid-user" },
        })
      );

      const state = store.getState().messages;
      expect(state.status.mention).toBe("failed");
      expect(state.error).toBe("Invalid mention");
    });

    it("should handle authorization errors", async () => {
      const { message, mentions } = setupMessageWithMentionScenario(1);
      setupStoreWithMessages([message]);

      const error = new ApiError(
        "Not authorized to delete mention",
        ApiErrorType.AUTHORIZATION,
        403
      );

      (
        apiClient.threads.messages.mentions.deleteMention as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        deleteMention({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          mentionId: mentions[0].id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.mention).toBe("failed");
      expect(state.error).toBe("Not authorized to delete mention");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple concurrent mention operations", async () => {
      const message = createMockMessageWithDetails();
      const mentions = createMockMentions(message.id, 2);

      setupStoreWithMessages([message]);

      (apiClient.threads.messages.mentions.createMention as jest.Mock)
        .mockResolvedValueOnce(createMockApiResponse(mentions[0]))
        .mockResolvedValueOnce(createMockApiResponse(mentions[1]));

      await Promise.all(
        mentions.map((mention) =>
          store.dispatch(
            createMention({
              householdId: "household-1",
              threadId: "thread-1",
              messageId: message.id,
              mentionData: { userId: mention.userId },
            })
          )
        )
      );

      const state = store.getState().messages;
      expect(state.status.mention).toBe("succeeded");
      expect(state.messages[0].mentions).toHaveLength(2);
      expect(state.error).toBeNull();
    });

    it("should maintain mention order after multiple operations", async () => {
      const { message, mentions } = setupMessageWithMentionScenario(3);
      setupStoreWithMessages([message]);

      // Delete middle mention
      (
        apiClient.threads.messages.mentions.deleteMention as jest.Mock
      ).mockResolvedValue(createMockApiResponse(undefined));

      await store.dispatch(
        deleteMention({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          mentionId: mentions[1].id,
        })
      );

      const state = store.getState().messages;
      expect(state.messages[0].mentions).toHaveLength(2);
      expect(state.messages[0].mentions?.[0].id).toBe(mentions[0].id);
      expect(state.messages[0].mentions?.[1].id).toBe(mentions[2].id);
    });
  });

  describe("State Transitions", () => {
    it("should handle loading states during mention creation", async () => {
      const message = createMockMessageWithDetails();
      const mention = createMockMention(message.id);

      setupStoreWithMessages([message]);

      let resolveMention: (value: any) => void;
      const mentionPromise = new Promise((resolve) => {
        resolveMention = resolve;
      });

      (
        apiClient.threads.messages.mentions.createMention as jest.Mock
      ).mockReturnValue(mentionPromise);

      const dispatchPromise = store.dispatch(
        createMention({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          mentionData: { userId: mention.userId },
        })
      );

      // Check loading state
      let state = store.getState().messages;
      expect(state.status.mention).toBe("loading");

      // Resolve mention creation
      resolveMention!(createMockApiResponse(mention));
      await dispatchPromise;

      // Check success state
      state = store.getState().messages;
      expect(state.status.mention).toBe("succeeded");
    });
  });
});
