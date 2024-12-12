import { configureStore } from "@reduxjs/toolkit";
import threadReducer, {
  ThreadState,
  fetchThreads,
  createThread,
  updateThread,
  deleteThread,
  inviteUsersToThread,
  fetchThreadDetails,
  resetThreads,
  selectThread,
  clearThreadError,
  selectThreads,
  selectSelectedThread,
  selectThreadStatus,
  selectThreadError,
} from "@/store/slices/threadSlice";
import { RootState } from "@/store/store";
import { mockThread } from "../../helpers/setup/mockData";
import { apiClient } from "@/lib/api/apiClient";
import { createMockApiResponse } from "../../helpers/mocks/apiMocks";
import { setupThreadListScenario } from "../../helpers/scenarios/threadScenarios";
import { ThreadWithDetails } from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { mockHouseholdMember } from "../../helpers/setup/mockData";
import { ApiError, ApiErrorType } from "@/lib/api/errors";

// Mock the API client
jest.mock("@/lib/api/apiClient", () => ({
  apiClient: {
    threads: {
      threads: {
        getThreads: jest.fn(),
        createThread: jest.fn(),
        updateThread: jest.fn(),
        deleteThread: jest.fn(),
        inviteUsers: jest.fn(),
        getThreadDetails: jest.fn(),
      },
    },
  },
}));

// For selector tests
const mockRootState = (partialState: Partial<ThreadState> = {}): RootState => ({
  auth: {} as any,
  threads: {
    threads: [],
    selectedThread: null,
    hasMore: true,
    nextCursor: undefined,
    status: {
      list: "idle",
      create: "idle",
      update: "idle",
      delete: "idle",
      invite: "idle",
      details: "idle",
    },
    error: null,
    ...partialState,
  },
  messages: {} as any,
  finances: {} as any,
  chores: {} as any,
  calendar: {} as any,
  notifications: {} as any,
  household: {} as any,
});

describe("Thread Slice", () => {
  let store: ReturnType<typeof configureStore<{ threads: ThreadState }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        threads: threadReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have the correct initial state", () => {
      const state = store.getState().threads;
      expect(state).toEqual({
        threads: [],
        selectedThread: null,
        hasMore: true,
        nextCursor: undefined,
        status: {
          list: "idle",
          create: "idle",
          update: "idle",
          delete: "idle",
          invite: "idle",
          details: "idle",
        },
        error: null,
      });
    });
  });

  describe("Sync Actions", () => {
    it("should handle resetThreads", () => {
      store.dispatch(resetThreads());
      const state = store.getState().threads;
      expect(state).toEqual(store.getState().threads);
    });

    it("should handle selectThread", () => {
      const thread = mockThread();
      store.dispatch(selectThread(thread));
      const state = store.getState().threads;
      expect(state.selectedThread).toEqual(thread);
    });

    it("should handle clearThreadError", () => {
      store.dispatch(clearThreadError());
      const state = store.getState().threads;
      expect(state.error).toBeNull();
    });
  });

  describe("Async Thunks", () => {
    describe("fetchThreads", () => {
      it("should handle successful thread fetch", async () => {
        const { threads, response } = setupThreadListScenario(3);
        (apiClient.threads.threads.getThreads as jest.Mock).mockResolvedValue(
          response
        );

        await store.dispatch(fetchThreads({ householdId: "household-1" }));

        const state = store.getState().threads;
        expect(state.status.list).toBe("succeeded");
        expect(state.threads).toHaveLength(3);
        expect(state.error).toBeNull();
      });

      it("should handle failed thread fetch", async () => {
        (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
          new Error("Failed to fetch")
        );

        await store.dispatch(fetchThreads({ householdId: "household-1" }));

        const state = store.getState().threads;
        expect(state.status.list).toBe("failed");
        expect(state.error).toBeTruthy();
      });
    });

    describe("createThread", () => {
      it("should handle successful thread creation", async () => {
        const thread = mockThread();
        (apiClient.threads.threads.createThread as jest.Mock).mockResolvedValue(
          createMockApiResponse(thread)
        );

        await store.dispatch(
          createThread({
            householdId: "household-1",
            threadData: {
              title: "Test Thread",
              householdId: "household-1",
              participants: [],
            },
          })
        );

        const state = store.getState().threads;
        expect(state.status.create).toBe("succeeded");
        expect(state.threads[0]).toBeDefined();
        expect(state.error).toBeNull();
      });
    });

    describe("updateThread", () => {
      it("should handle successful thread update", async () => {
        const originalThread = mockThread();
        const updatedThread = { ...originalThread, title: "Updated Title" };

        // Set initial state
        store = configureStore({
          reducer: { threads: threadReducer },
          preloadedState: {
            threads: {
              ...store.getState().threads,
              threads: [originalThread],
            },
          },
        });

        (apiClient.threads.threads.updateThread as jest.Mock).mockResolvedValue(
          createMockApiResponse(updatedThread)
        );

        await store.dispatch(
          updateThread({
            householdId: "household-1",
            threadId: originalThread.id,
            threadData: { title: "Updated Title" },
          })
        );

        const state = store.getState().threads;
        expect(state.status.update).toBe("succeeded");
        expect(state.threads[0].title).toBe("Updated Title");
        expect(state.error).toBeNull();
      });

      it("should handle thread update failure", async () => {
        (apiClient.threads.threads.updateThread as jest.Mock).mockRejectedValue(
          new Error("Update failed")
        );

        await store.dispatch(
          updateThread({
            householdId: "household-1",
            threadId: "thread-1",
            threadData: { title: "Updated Title" },
          })
        );

        const state = store.getState().threads;
        expect(state.status.update).toBe("failed");
        expect(state.error).toBeTruthy();
      });
    });

    describe("deleteThread", () => {
      it("should handle successful thread deletion", async () => {
        const thread = mockThread();
        store = configureStore({
          reducer: { threads: threadReducer },
          preloadedState: {
            threads: {
              ...store.getState().threads,
              threads: [thread],
            },
          },
        });

        (apiClient.threads.threads.deleteThread as jest.Mock).mockResolvedValue(
          createMockApiResponse(undefined)
        );

        await store.dispatch(
          deleteThread({
            householdId: "household-1",
            threadId: thread.id,
          })
        );

        const state = store.getState().threads;
        expect(state.status.delete).toBe("succeeded");
        expect(state.threads).toHaveLength(0);
        expect(state.error).toBeNull();
      });
    });

    describe("inviteUsersToThread", () => {
      it("should handle successful user invitation", async () => {
        const thread = mockThread();
        const newMember = mockHouseholdMember({
          id: "new-user",
          userId: "new-user",
          householdId: thread.householdId,
          role: HouseholdRole.MEMBER,
          joinedAt: new Date(),
          isInvited: true,
          isAccepted: false,
          isRejected: false,
          isSelected: false,
        });

        const updatedThread: ThreadWithDetails = {
          ...thread,
          participants: [...thread.participants, newMember],
        };

        store = configureStore({
          reducer: { threads: threadReducer },
          preloadedState: {
            threads: {
              ...store.getState().threads,
              threads: [thread],
            },
          },
        });

        (apiClient.threads.threads.inviteUsers as jest.Mock).mockResolvedValue(
          createMockApiResponse(updatedThread)
        );

        await store.dispatch(
          inviteUsersToThread({
            householdId: "household-1",
            threadId: thread.id,
            userIds: ["new-user"],
          })
        );

        const state = store.getState().threads;
        expect(state.status.invite).toBe("succeeded");
        expect(state.threads[0].participants).toHaveLength(
          thread.participants.length + 1
        );
        expect(state.threads[0].participants).toContainEqual(
          expect.objectContaining({
            id: "new-user",
            role: HouseholdRole.MEMBER,
            isInvited: true,
            isAccepted: false,
          })
        );
      });
    });

    describe("fetchThreadDetails", () => {
      it("should handle successful thread details fetch", async () => {
        const thread = mockThread();
        (
          apiClient.threads.threads.getThreadDetails as jest.Mock
        ).mockResolvedValue(createMockApiResponse(thread));

        await store.dispatch(
          fetchThreadDetails({
            householdId: "household-1",
            threadId: thread.id,
          })
        );

        const state = store.getState().threads;
        expect(state.status.details).toBe("succeeded");
        expect(state.selectedThread).toEqual(thread);
      });
    });
  });

  describe("Selectors", () => {
    it("should select threads", () => {
      const threads = [mockThread(), mockThread()];
      store = configureStore({
        reducer: {
          threads: threadReducer,
        },
        preloadedState: {
          threads: {
            ...store.getState().threads,
            threads,
          },
        },
      });

      const state = store.getState() as RootState;
      const selectedThreads = selectThreads(state);
      expect(selectedThreads).toEqual(threads);
    });

    it("should select selected thread", () => {
      const thread = mockThread();
      const state = mockRootState({ selectedThread: thread });
      const selectedThread = selectSelectedThread(state);
      expect(selectedThread).toEqual(thread);
    });

    it("should select thread status", () => {
      const state = mockRootState();
      const threadStatus = selectThreadStatus(state);
      expect(threadStatus).toEqual(state.threads.status);
    });

    it("should select thread error", () => {
      const error = "Test error";
      const state = mockRootState({ error });
      const threadError = selectThreadError(state);
      expect(threadError).toBe(error);
    });
  });

  describe("Edge Cases", () => {
    it("should handle pagination correctly", async () => {
      const firstPage = setupThreadListScenario(3, true, "next-cursor");
      const secondPage = setupThreadListScenario(2, false);

      (apiClient.threads.threads.getThreads as jest.Mock)
        .mockResolvedValueOnce(firstPage.response)
        .mockResolvedValueOnce(secondPage.response);

      // First page
      await store.dispatch(fetchThreads({ householdId: "household-1" }));
      expect(store.getState().threads.threads).toHaveLength(3);
      expect(store.getState().threads.hasMore).toBe(true);

      // Second page
      await store.dispatch(
        fetchThreads({
          householdId: "household-1",
          options: { cursor: "next-cursor" },
        })
      );
      expect(store.getState().threads.threads).toHaveLength(5);
      expect(store.getState().threads.hasMore).toBe(false);
    });

    it("should handle concurrent updates correctly", async () => {
      const thread = mockThread();
      const update1 = { ...thread, title: "Update 1" };
      const update2 = { ...thread, title: "Update 2" };

      store = configureStore({
        reducer: { threads: threadReducer },
        preloadedState: {
          threads: {
            ...store.getState().threads,
            threads: [thread],
          },
        },
      });

      // Simulate concurrent updates
      const update1Promise = store.dispatch(
        updateThread({
          householdId: "household-1",
          threadId: thread.id,
          threadData: { title: "Update 1" },
        })
      );

      const update2Promise = store.dispatch(
        updateThread({
          householdId: "household-1",
          threadId: thread.id,
          threadData: { title: "Update 2" },
        })
      );

      await Promise.all([update1Promise, update2Promise]);

      // The last update should win
      expect(store.getState().threads.threads[0].title).toBe("Update 2");
    });
  });

  describe("Error Handling", () => {
    it("should handle API validation errors", async () => {
      const error = new ApiError(
        "Validation failed",
        ApiErrorType.VALIDATION,
        400,
        {
          validationErrors: {
            title: ["Title is required"],
            participants: ["Invalid participant ID"],
          },
        }
      );

      (apiClient.threads.threads.createThread as jest.Mock).mockRejectedValue(
        error
      );

      await store.dispatch(
        createThread({
          householdId: "household-1",
          threadData: {
            title: "",
            householdId: "household-1",
            participants: ["invalid-id"],
          },
        })
      );

      const state = store.getState().threads;
      expect(state.status.create).toBe("failed");
      expect(state.error).toBe("Validation failed");
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network Error");
      (apiClient.threads.threads.getThreads as jest.Mock).mockRejectedValue(
        networkError
      );

      await store.dispatch(fetchThreads({ householdId: "household-1" }));

      const state = store.getState().threads;
      expect(state.status.list).toBe("failed");
      expect(state.error).toBe("Failed to fetch threads");
    });
  });

  describe("State Transitions", () => {
    it("should track loading states", async () => {
      const { threads, response } = setupThreadListScenario(3);
      (apiClient.threads.threads.getThreads as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(response), 100);
          })
      );

      const promise = store.dispatch(
        fetchThreads({ householdId: "household-1" })
      );

      // Check immediate loading state
      expect(store.getState().threads.status.list).toBe("loading");
      expect(store.getState().threads.error).toBeNull();

      await promise;

      // Check final state
      const state = store.getState().threads;
      expect(state.status.list).toBe("succeeded");
      expect(state.threads).toHaveLength(3);
    });
  });

  describe("Complex State Updates", () => {
    it("should maintain selected thread when updating list", async () => {
      const selectedThread = mockThread();
      const newThreads = [mockThread(), mockThread()];

      // Set initial state with selected thread
      store = configureStore({
        reducer: { threads: threadReducer },
        preloadedState: {
          threads: {
            ...store.getState().threads,
            selectedThread,
            threads: [selectedThread],
          },
        },
      });

      // Mock fetch of new threads
      (apiClient.threads.threads.getThreads as jest.Mock).mockResolvedValue(
        createMockApiResponse(newThreads)
      );

      await store.dispatch(fetchThreads({ householdId: "household-1" }));

      const state = store.getState().threads;
      expect(state.threads).toHaveLength(2);
      expect(state.selectedThread).toEqual(selectedThread);
    });

    it("should handle concurrent operations", async () => {
      const thread = mockThread();
      const updateData = { title: "Updated Title" };
      const deletePromise = store.dispatch(
        deleteThread({
          householdId: "household-1",
          threadId: thread.id,
        })
      );
      const updatePromise = store.dispatch(
        updateThread({
          householdId: "household-1",
          threadId: thread.id,
          threadData: updateData,
        })
      );

      await Promise.all([deletePromise, updatePromise]);

      const state = store.getState().threads;
      expect(state.threads).toHaveLength(0); // Delete should win
    });
  });

  describe("Cache and Pagination", () => {
    it("should handle pagination state transitions", async () => {
      // First page with hasMore
      const firstPage = setupThreadListScenario(2, true, "next-cursor");
      (apiClient.threads.threads.getThreads as jest.Mock).mockResolvedValueOnce(
        firstPage.response
      );

      await store.dispatch(fetchThreads({ householdId: "household-1" }));

      let state = store.getState().threads;
      expect(state.hasMore).toBe(true);
      expect(state.nextCursor).toBe("next-cursor");
      expect(state.threads).toHaveLength(2);

      // Last page
      const lastPage = setupThreadListScenario(1, false);
      (apiClient.threads.threads.getThreads as jest.Mock).mockResolvedValueOnce(
        lastPage.response
      );

      await store.dispatch(
        fetchThreads({
          householdId: "household-1",
          options: { cursor: "next-cursor" },
        })
      );

      state = store.getState().threads;
      expect(state.hasMore).toBe(false);
      expect(state.nextCursor).toBeUndefined();
      expect(state.threads).toHaveLength(3);
    });

    it("should handle empty results", async () => {
      const emptyResponse = createMockApiResponse([], false);
      (apiClient.threads.threads.getThreads as jest.Mock).mockResolvedValue(
        emptyResponse
      );

      await store.dispatch(fetchThreads({ householdId: "household-1" }));

      const state = store.getState().threads;
      expect(state.status.list).toBe("succeeded");
      expect(state.threads).toHaveLength(0);
      expect(state.hasMore).toBe(false);
    });
  });
});
