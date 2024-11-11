import { setupStore } from "../../../utils/test-utils";
import { ReactionType, HouseholdRole, MessageAction } from "@shared/enums";
import {
  fetchMessages,
  createMessage,
  addReaction,
  selectMessages,
  selectMessageStatus,
} from "../messagesSlice";
import { apiClient } from "../../../lib/api/apiClient";
import {
  MessageWithDetails,
  Thread,
  User,
  CreateMessageDTO,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces";

jest.mock("../../../lib/api/apiClient");

describe("Messages Slice", () => {
  let store: ReturnType<typeof setupStore>;

  const mockUser: User = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockThread: Thread = {
    id: "thread-1",
    title: "Test Thread",
    householdId: "household-1",
    authorId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const initialMessage: MessageWithDetails = {
    id: "1",
    content: "Test Message",
    authorId: mockUser.id,
    threadId: mockThread.id,
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

  describe("fetchMessages", () => {
    it("should fetch messages successfully", async () => {
      const mockMessages = [initialMessage];
      const mockApiResponse = {
        data: mockMessages,
        pagination: {
          hasMore: false,
          nextCursor: undefined,
        },
      };

      (apiClient.threads.messages.getMessages as jest.Mock).mockResolvedValue(
        mockMessages
      );

      const result = await store.dispatch(
        fetchMessages({
          householdId: "household-1",
          threadId: "thread-1",
        })
      );

      const state = store.getState();
      expect(selectMessages(state)).toEqual(mockMessages);
      expect(selectMessageStatus(state).list).toBe("succeeded");
      expect(result.payload).toEqual({
        data: mockMessages,
        hasMore: false,
        nextCursor: undefined,
      });
    });

    it("should handle fetch messages error", async () => {
      const errorMessage = "Failed to fetch messages";
      (apiClient.threads.messages.getMessages as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(
        fetchMessages({
          householdId: "household-1",
          threadId: "thread-1",
        })
      );

      const state = store.getState();
      expect(selectMessageStatus(state).list).toBe("failed");
      expect(state.messages.error).toBe(errorMessage);
    });
  });

  describe("createMessage", () => {
    it("should create message successfully", async () => {
      const messageData: CreateMessageDTO = {
        threadId: mockThread.id,
        content: "New test message",
      };

      const mockApiResponse: ApiResponse<MessageWithDetails> = {
        data: {
          ...initialMessage,
          content: messageData.content,
        },
      };

      (apiClient.threads.messages.createMessage as jest.Mock).mockResolvedValue(
        mockApiResponse.data
      );

      const result = await store.dispatch(
        createMessage({
          householdId: "household-1",
          threadId: mockThread.id,
          messageData,
        })
      );

      if (typeof result.payload === "string") {
        fail("Expected MessageWithDetails but got string");
        return;
      }

      const state = store.getState();
      expect(state.messages.status.create).toBe("succeeded");
      expect(result.payload.content).toBe(messageData.content);
    });
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
        userId: mockUser.id,
        createdAt: new Date(),
        user: mockUser,
      };

      (
        apiClient.threads.messages.reactions.addReaction as jest.Mock
      ).mockResolvedValue(newReaction);

      await store.dispatch(
        addReaction({
          householdId: "household-1",
          threadId: mockThread.id,
          messageId: "1",
          reaction: {
            emoji: "👍",
            type: ReactionType.LIKE,
          },
        })
      );

      const state = store.getState();
      expect(state.messages.messages[0]?.reactions).toContainEqual(newReaction);
      expect(state.messages.status.reaction).toBe("succeeded");
    });
  });
});
