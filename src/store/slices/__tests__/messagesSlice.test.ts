import { setupStore } from "../../../utils/test-utils";
import { ReactionType } from "@shared/enums/messages";
import {
  fetchMessages,
  createMessage,
  addReaction,
  selectMessages,
  selectMessageStatus,
} from "../messagesSlice";
import { apiClient } from "../../../lib/api/apiClient";
import { MessageWithDetails, Thread, User } from "@shared/types";

jest.mock("../../../lib/api/apiClient");

describe("Messages Slice", () => {
  let store: ReturnType<typeof setupStore>;

  const mockThread: Thread = {
    id: "thread-1",
    title: "Test Thread",
    householdId: "household-1",
    authorId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const initialMessage: MessageWithDetails = {
    id: "1",
    content: "Test Message",
    authorId: "user-1",
    threadId: "thread-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    reactions: [],
    thread: mockThread,
    author: mockUser,
    attachments: [],
    mentions: [],
    reads: [],
    poll: undefined,
  };

  beforeEach(() => {
    store = setupStore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("reactions", () => {
    it("should add reaction to message successfully", async () => {
      store = setupStore({
        messages: {
          messages: [initialMessage],
          selectedMessage: null,
          status: {
            list: "idle",
            create: "idle",
            update: "idle",
            delete: "idle",
            reaction: "idle",
            attachment: "idle",
            poll: "idle",
            mention: "idle",
            read: "idle",
          },
          error: null,
          hasMore: false,
          nextCursor: undefined,
        },
      });

      const newReaction = {
        id: "reaction-1",
        messageId: "1",
        emoji: "👍",
        type: ReactionType.LIKE,
        userId: "user-1",
        createdAt: new Date(),
      };

      (
        apiClient.threads.messages.reactions.addReaction as jest.Mock
      ).mockResolvedValue(newReaction);

      await store.dispatch(
        addReaction({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: "1",
          reaction: {
            emoji: "👍",
            type: ReactionType.LIKE,
          },
        })
      );

      const state = store.getState();
      expect(state.messages.messages[0].reactions).toContainEqual(newReaction);
      expect(state.messages.status.reaction).toBe("succeeded");
    });
  });

  describe("fetchMessages", () => {
    it("should fetch messages successfully", async () => {
      const mockMessages: MessageWithDetails[] = [
        {
          ...initialMessage,
          id: "1",
          content: "Message 1",
        },
        {
          ...initialMessage,
          id: "2",
          content: "Message 2",
        },
      ];

      const mockResponse = {
        data: mockMessages,
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      };

      (apiClient.threads.messages.getMessages as jest.Mock).mockResolvedValue(
        mockResponse
      );

      await store.dispatch(
        fetchMessages({
          householdId: "household-1",
          threadId: "thread-1",
        })
      );

      const state = store.getState();
      expect(selectMessages(state)).toEqual(mockMessages);
      expect(selectMessageStatus(state).list).toBe("succeeded");
    });
  });
});
