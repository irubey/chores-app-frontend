import messagesReducer, {
  createPoll,
  updatePoll,
  deletePoll,
  getPoll,
  getPollsInThread,
  votePoll,
  removePollVote,
  getPollAnalytics,
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
import { PollType, PollStatus } from "@shared/enums";
import {
  createMockMessageWithDetails,
  createMockPoll,
  createMockPollDTO,
  createMockPollVote,
} from "../../../helpers/factories/messages/messageFactory";
import { setupMessageWithPollScenario } from "../../../helpers/scenarios/messages/messageScenarios";
import { createInitialState } from "../../../helpers/utils/testUtils";

// Mock the API client
jest.mock("@/lib/api/apiClient", () => ({
  apiClient: createMockApiClient(),
}));

describe("Messages Slice - Poll Operations", () => {
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
    it("should handle creating a poll", async () => {
      const { message } = setupMessageWithPollScenario();
      const pollDTO = createMockPollDTO({
        question: "Test poll?",
        pollType: PollType.MULTIPLE_CHOICE,
        options: [
          { text: "Option 1", order: 0 },
          { text: "Option 2", order: 1 },
        ],
      });

      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.polls.createPoll as jest.Mock
      ).mockResolvedValue(createMockApiResponse(message.poll));

      await store.dispatch(
        createPoll({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollData: pollDTO,
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("succeeded");
      expect(state.messages[0].poll).toBeDefined();
      expect(state.messages[0].poll?.question).toBe(pollDTO.question);
      expect(state.error).toBeNull();
    });

    it("should handle updating a poll", async () => {
      const { message, poll } = setupMessageWithPollScenario();
      const updatedPoll = { ...poll, status: PollStatus.CLOSED };

      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.polls.updatePoll as jest.Mock
      ).mockResolvedValue(createMockApiResponse(updatedPoll));

      await store.dispatch(
        updatePoll({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollId: poll.id,
          pollData: { status: PollStatus.CLOSED },
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("succeeded");
      expect(state.messages[0].poll?.status).toBe(PollStatus.CLOSED);
    });

    it("should handle voting on a poll", async () => {
      const { message, poll } = setupMessageWithPollScenario(2, 0);
      const vote = createMockPollVote(poll.id, poll.options[0].id);

      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.polls.votePoll as jest.Mock
      ).mockResolvedValue(createMockApiResponse(vote));
      (apiClient.threads.messages.polls.getPoll as jest.Mock).mockResolvedValue(
        createMockApiResponse({
          ...poll,
          options: [
            {
              ...poll.options[0],
              votes: [vote],
              voteCount: 1,
            },
            poll.options[1],
          ],
        })
      );

      await store.dispatch(
        votePoll({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollId: poll.id,
          vote: { optionId: poll.options[0].id },
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("succeeded");
      expect(state.messages[0].poll?.options[0].voteCount).toBe(1);
    });

    it("should handle deleting a poll", async () => {
      const { message, poll } = setupMessageWithPollScenario();
      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.polls.deletePoll as jest.Mock
      ).mockResolvedValue(createMockApiResponse(undefined));

      await store.dispatch(
        deletePoll({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollId: poll.id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("succeeded");
      expect(state.messages[0].poll).toBeUndefined();
      expect(state.error).toBeNull();
    });

    it("should handle getting a poll", async () => {
      const { message, poll } = setupMessageWithPollScenario(2, 1);
      setupStoreWithMessages([message]);

      (apiClient.threads.messages.polls.getPoll as jest.Mock).mockResolvedValue(
        createMockApiResponse(poll)
      );

      await store.dispatch(
        getPoll({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollId: poll.id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("succeeded");
      expect(state.messages[0].poll).toEqual(poll);
      expect(state.error).toBeNull();
    });

    it("should handle getting polls in thread", async () => {
      const { message, poll } = setupMessageWithPollScenario();
      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.polls.getPollsInThread as jest.Mock
      ).mockResolvedValue(createMockApiResponse([poll]));

      await store.dispatch(
        getPollsInThread({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("succeeded");
      expect(state.error).toBeNull();
    });

    it("should handle getting poll analytics", async () => {
      const { message, poll } = setupMessageWithPollScenario(2, 2);
      const analytics = {
        totalVotes: 4,
        optionBreakdown: {
          [poll.options[0].id]: 2,
          [poll.options[1].id]: 2,
        },
      };

      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.polls.getPollAnalytics as jest.Mock
      ).mockResolvedValue(createMockApiResponse(analytics));

      await store.dispatch(
        getPollAnalytics({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollId: poll.id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("succeeded");
      expect(state.error).toBeNull();
    });

    it("should handle removing a poll vote", async () => {
      const { message, poll } = setupMessageWithPollScenario(2, 1); // Create poll with 2 options and 1 vote
      const vote = poll.options[0].votes[0]; // Get the first vote

      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.polls.removePollVote as jest.Mock
      ).mockResolvedValue(createMockApiResponse(undefined));

      // Mock getting updated poll after vote removal
      (apiClient.threads.messages.polls.getPoll as jest.Mock).mockResolvedValue(
        createMockApiResponse({
          ...poll,
          options: [
            {
              ...poll.options[0],
              votes: [],
              voteCount: 0,
            },
            poll.options[1],
          ],
        })
      );

      await store.dispatch(
        removePollVote({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollId: poll.id,
          optionId: vote.optionId,
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("succeeded");
      expect(state.messages[0].poll?.options[0].voteCount).toBe(0);
      expect(state.messages[0].poll?.options[0].votes).toHaveLength(0);
      expect(state.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors when creating poll", async () => {
      const message = createMockMessageWithDetails();
      setupStoreWithMessages([message]);

      const error = new ApiError("Invalid poll", ApiErrorType.VALIDATION, 400, {
        validationErrors: {
          question: ["Question is required"],
          options: ["Minimum 2 options required"],
        },
      });

      (
        apiClient.threads.messages.polls.createPoll as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        createPoll({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollData: {
            question: "",
            pollType: PollType.MULTIPLE_CHOICE,
            options: [{ text: "Option 1", order: 0 }],
          },
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("failed");
      expect(state.error).toBe("Invalid poll");
    });

    it("should handle authorization errors", async () => {
      const { message, poll } = setupMessageWithPollScenario();
      setupStoreWithMessages([message]);

      const error = new ApiError(
        "Not authorized to update poll",
        ApiErrorType.AUTHORIZATION,
        403
      );

      (
        apiClient.threads.messages.polls.updatePoll as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        updatePoll({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollId: poll.id,
          pollData: { status: PollStatus.CLOSED },
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("failed");
      expect(state.error).toBe("Not authorized to update poll");
    });

    it("should handle not found error when getting poll", async () => {
      const message = createMockMessageWithDetails();
      setupStoreWithMessages([message]);

      const error = new ApiError("Poll not found", ApiErrorType.NOT_FOUND, 404);

      (apiClient.threads.messages.polls.getPoll as jest.Mock).mockRejectedValue(
        error
      );

      await store.dispatch(
        getPoll({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollId: "non-existent",
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("failed");
      expect(state.error).toBe("Poll not found");
    });

    it("should handle errors when removing a poll vote", async () => {
      const { message, poll } = setupMessageWithPollScenario(2, 1);
      const vote = poll.options[0].votes[0];

      setupStoreWithMessages([message]);

      const error = new ApiError("Vote not found", ApiErrorType.NOT_FOUND, 404);

      (
        apiClient.threads.messages.polls.removePollVote as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        removePollVote({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollId: poll.id,
          optionId: "non-existent",
        })
      );

      const state = store.getState().messages;
      expect(state.status.poll).toBe("failed");
      expect(state.error).toBe("Vote not found");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple concurrent votes", async () => {
      const { message, poll } = setupMessageWithPollScenario(2, 0);
      const votes = poll.options.map((option) =>
        createMockPollVote(poll.id, option.id)
      );

      setupStoreWithMessages([message]);

      (apiClient.threads.messages.polls.votePoll as jest.Mock)
        .mockResolvedValueOnce(createMockApiResponse(votes[0]))
        .mockResolvedValueOnce(createMockApiResponse(votes[1]));

      (
        apiClient.threads.messages.polls.getPoll as jest.Mock
      ).mockResolvedValueOnce(
        createMockApiResponse({
          ...poll,
          options: poll.options.map((opt, idx) => ({
            ...opt,
            votes: [votes[idx]],
            voteCount: 1,
          })),
        })
      );

      await Promise.all(
        poll.options.map((option) =>
          store.dispatch(
            votePoll({
              householdId: "household-1",
              threadId: "thread-1",
              messageId: message.id,
              pollId: poll.id,
              vote: { optionId: option.id },
            })
          )
        )
      );

      const state = store.getState().messages;
      expect(
        state.messages[0].poll?.options.every((opt) => opt.voteCount === 1)
      ).toBe(true);
    });

    it("should handle poll status transitions", async () => {
      const { message, poll } = setupMessageWithPollScenario();
      setupStoreWithMessages([message]);

      const statusTransitions = [PollStatus.CLOSED, PollStatus.CONFIRMED];

      for (const status of statusTransitions) {
        (
          apiClient.threads.messages.polls.updatePoll as jest.Mock
        ).mockResolvedValueOnce(
          createMockApiResponse({
            ...poll,
            status,
          })
        );

        await store.dispatch(
          updatePoll({
            householdId: "household-1",
            threadId: "thread-1",
            messageId: message.id,
            pollId: poll.id,
            pollData: { status },
          })
        );

        const state = store.getState().messages;
        expect(state.messages[0].poll?.status).toBe(status);
      }
    });
  });

  describe("State Transitions", () => {
    it("should handle loading states during poll creation", async () => {
      const message = createMockMessageWithDetails();
      const poll = createMockPoll(message.id);

      setupStoreWithMessages([message]);

      let resolvePoll: (value: any) => void;
      const pollPromise = new Promise((resolve) => {
        resolvePoll = resolve;
      });

      (
        apiClient.threads.messages.polls.createPoll as jest.Mock
      ).mockReturnValue(pollPromise);

      const dispatchPromise = store.dispatch(
        createPoll({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          pollData: createMockPollDTO(),
        })
      );

      // Check loading state
      let state = store.getState().messages;
      expect(state.status.poll).toBe("loading");

      // Resolve poll creation
      resolvePoll!(createMockApiResponse(poll));
      await dispatchPromise;

      // Check success state
      state = store.getState().messages;
      expect(state.status.poll).toBe("succeeded");
    });
  });
});
