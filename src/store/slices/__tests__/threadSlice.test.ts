import { setupStore, mockThread } from "../../../utils/test-utils";
import {
  fetchThreads,
  createThread,
  updateThread,
  deleteThread,
  selectThreads,
  selectSelectedThread,
  ThreadState,
} from "../threadSlice";
import { apiClient } from "../../../lib/api/apiClient";
import { Thread, ThreadWithMessages } from "@shared/types";

// Mock the API client
jest.mock("../../../lib/api/apiClient");

type Status = "idle" | "loading" | "succeeded" | "failed";

describe("Thread Slice", () => {
  let store: ReturnType<typeof setupStore>;

  const mockInitialThread: ThreadWithMessages = {
    id: "1",
    title: "Thread to Delete",
    messages: [],
    householdId: "household-1",
    authorId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const initialState: ThreadState = {
    threads: [],
    selectedThread: null,
    status: {
      list: "idle" as Status,
      create: "idle" as Status,
      update: "idle" as Status,
      delete: "idle" as Status,
      invite: "idle" as Status,
      details: "idle" as Status,
    },
    error: null,
  };

  beforeEach(() => {
    store = setupStore({
      threads: initialState,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchThreads", () => {
    it("should fetch threads successfully", async () => {
      const mockThreads = [
        { id: "1", title: "Thread 1" },
        { id: "2", title: "Thread 2" },
      ];

      (apiClient.threads.threads.getThreads as jest.Mock).mockResolvedValue(
        mockThreads
      );

      await store.dispatch(fetchThreads({ householdId: "household-1" }));

      const state = store.getState();
      expect(selectThreads(state)).toEqual(mockThreads);
      expect(state.threads.status.list).toBe("succeeded");
    });

    it("should handle fetch threads error", async () => {
      const errorMessage = "Failed to fetch threads";
      (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(fetchThreads({ householdId: "household-1" }));

      const state = store.getState();
      expect(state.threads.status.list).toBe("failed");
      expect(state.threads.error).toBe(errorMessage);
    });
  });

  describe("createThread", () => {
    it("should create thread successfully", async () => {
      const newThread = {
        id: "1",
        title: "New Thread",
        participants: [],
        householdId: "household-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: "user-1",
      };

      (apiClient.threads.threads.createThread as jest.Mock).mockResolvedValue(
        newThread
      );

      await store.dispatch(
        createThread({
          householdId: "household-1",
          threadData: {
            title: "New Thread",
            householdId: "household-1",
            participants: [],
          },
        })
      );

      const state = store.getState();
      expect(state.threads.threads[0]).toMatchObject(newThread);
      expect(state.threads.status.create).toBe("succeeded");
    });
  });

  describe("updateThread", () => {
    it("should update thread successfully", async () => {
      // Setup initial state with a thread
      store = setupStore({
        threads: {
          ...initialState,
          threads: [mockInitialThread],
        },
      });

      const updatedThread = {
        ...mockInitialThread,
        title: "Updated Title",
      };

      (apiClient.threads.threads.updateThread as jest.Mock).mockResolvedValue(
        updatedThread
      );

      await store.dispatch(
        updateThread({
          householdId: "household-1",
          threadId: "1",
          threadData: { title: "Updated Title" },
        })
      );

      const state = store.getState();
      expect(state.threads.threads[0].title).toBe("Updated Title");
      expect(state.threads.status.update).toBe("succeeded");
    });
  });

  describe("deleteThread", () => {
    it("should delete thread successfully", async () => {
      store = setupStore({
        threads: {
          ...initialState,
          threads: [mockInitialThread],
        },
      });

      (apiClient.threads.threads.deleteThread as jest.Mock).mockResolvedValue(
        undefined
      );

      await store.dispatch(
        deleteThread({
          householdId: "household-1",
          threadId: "1",
        })
      );

      const state = store.getState();
      expect(state.threads.threads).toHaveLength(0);
      expect(state.threads.status.delete).toBe("succeeded");
    });
  });
});
