import messagesReducer, {
  addReaction,
  removeReaction,
  getReactions,
  getReactionAnalytics,
  getReactionsByType,
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
import { ReactionType } from "@shared/enums";
import {
  createMockMessageWithDetails,
  createMockReaction,
} from "../../../helpers/factories/messages/messageFactory";
import { setupMessageWithReactionScenario } from "../../../helpers/scenarios/messages/messageScenarios";
import { createInitialState } from "../../../helpers/utils/testUtils";

// Mock the API client
jest.mock("@/lib/api/apiClient", () => ({
  apiClient: createMockApiClient(),
}));

describe("Messages Slice - Reaction Operations", () => {
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
    it("should handle adding a reaction", async () => {
      const { message, reactions } = setupMessageWithReactionScenario(1);
      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.reactions.addReaction as jest.Mock
      ).mockResolvedValue(createMockApiResponse(reactions[0]));

      await store.dispatch(
        addReaction({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          reaction: {
            type: ReactionType.LIKE,
            emoji: "👍",
          },
        })
      );

      const state = store.getState().messages;
      expect(state.status.reaction).toBe("succeeded");
      expect(state.messages[0].reactions).toContainEqual(reactions[0]);
      expect(state.error).toBeNull();
    });

    it("should handle removing a reaction", async () => {
      const { message, reactions } = setupMessageWithReactionScenario(1);
      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.reactions.removeReaction as jest.Mock
      ).mockResolvedValue(createMockApiResponse(undefined));

      await store.dispatch(
        removeReaction({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          reactionId: reactions[0].id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.reaction).toBe("succeeded");
      expect(state.messages[0].reactions).toHaveLength(0);
      expect(state.error).toBeNull();
    });

    it("should handle getting reactions", async () => {
      const { message, reactions } = setupMessageWithReactionScenario(2);

      (
        apiClient.threads.messages.reactions.getReactions as jest.Mock
      ).mockResolvedValue(createMockApiResponse(reactions));

      await store.dispatch(
        getReactions({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.reaction).toBe("succeeded");
      expect(state.error).toBeNull();
    });

    it("should handle getting reaction analytics", async () => {
      const analytics: Record<ReactionType, number> = {
        [ReactionType.LIKE]: 5,
        [ReactionType.LOVE]: 3,
        [ReactionType.HAHA]: 2,
        [ReactionType.WOW]: 1,
        [ReactionType.SAD]: 0,
        [ReactionType.ANGRY]: 0,
      };

      (
        apiClient.threads.messages.reactions.getReactionAnalytics as jest.Mock
      ).mockResolvedValue(createMockApiResponse(analytics));

      await store.dispatch(
        getReactionAnalytics({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: "message-1",
        })
      );

      const state = store.getState().messages;
      expect(state.status.reaction).toBe("succeeded");
      expect(state.error).toBeNull();
    });

    it("should handle getting reactions by type", async () => {
      const reactionsByType = {
        [ReactionType.LIKE]: 10,
        [ReactionType.LOVE]: 5,
      };

      (
        apiClient.threads.messages.reactions.getReactionsByType as jest.Mock
      ).mockResolvedValue(createMockApiResponse(reactionsByType));

      await store.dispatch(
        getReactionsByType({
          householdId: "household-1",
        })
      );

      const state = store.getState().messages;
      expect(state.status.reaction).toBe("succeeded");
      expect(state.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors when adding reaction", async () => {
      const message = createMockMessageWithDetails();
      setupStoreWithMessages([message]);

      const error = new ApiError(
        "Invalid reaction",
        ApiErrorType.VALIDATION,
        400,
        {
          validationErrors: {
            type: ["Invalid reaction type"],
          },
        }
      );

      (
        apiClient.threads.messages.reactions.addReaction as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        addReaction({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          reaction: {
            type: "INVALID" as ReactionType,
            emoji: "invalid",
          },
        })
      );

      const state = store.getState().messages;
      expect(state.status.reaction).toBe("failed");
      expect(state.error).toBe("Invalid reaction");
    });

    it("should handle authorization errors", async () => {
      const { message, reactions } = setupMessageWithReactionScenario(1);
      setupStoreWithMessages([message]);

      const error = new ApiError(
        "Not authorized to remove reaction",
        ApiErrorType.AUTHORIZATION,
        403
      );

      (
        apiClient.threads.messages.reactions.removeReaction as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        removeReaction({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          reactionId: reactions[0].id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.reaction).toBe("failed");
      expect(state.error).toBe("Not authorized to remove reaction");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple concurrent reactions", async () => {
      const message = createMockMessageWithDetails();
      const reactions = [
        createMockReaction(message.id, { type: ReactionType.LIKE }),
        createMockReaction(message.id, { type: ReactionType.LOVE }),
      ];

      setupStoreWithMessages([message]);

      (apiClient.threads.messages.reactions.addReaction as jest.Mock)
        .mockResolvedValueOnce(createMockApiResponse(reactions[0]))
        .mockResolvedValueOnce(createMockApiResponse(reactions[1]));

      await Promise.all([
        store.dispatch(
          addReaction({
            householdId: "household-1",
            threadId: "thread-1",
            messageId: message.id,
            reaction: { type: ReactionType.LIKE, emoji: "👍" },
          })
        ),
        store.dispatch(
          addReaction({
            householdId: "household-1",
            threadId: "thread-1",
            messageId: message.id,
            reaction: { type: ReactionType.LOVE, emoji: "❤️" },
          })
        ),
      ]);

      const state = store.getState().messages;
      expect(state.messages[0].reactions).toHaveLength(2);
      expect(state.error).toBeNull();
    });
  });

  describe("State Transitions", () => {
    it("should handle loading states during reaction addition", async () => {
      const message = createMockMessageWithDetails();
      const reaction = createMockReaction(message.id);

      setupStoreWithMessages([message]);

      let resolveReaction: (value: any) => void;
      const reactionPromise = new Promise((resolve) => {
        resolveReaction = resolve;
      });

      (
        apiClient.threads.messages.reactions.addReaction as jest.Mock
      ).mockReturnValue(reactionPromise);

      const dispatchPromise = store.dispatch(
        addReaction({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          reaction: { type: ReactionType.LIKE, emoji: "👍" },
        })
      );

      // Check loading state
      let state = store.getState().messages;
      expect(state.status.reaction).toBe("loading");

      // Resolve reaction addition
      resolveReaction!(createMockApiResponse(reaction));
      await dispatchPromise;

      // Check success state
      state = store.getState().messages;
      expect(state.status.reaction).toBe("succeeded");
    });
  });
});
