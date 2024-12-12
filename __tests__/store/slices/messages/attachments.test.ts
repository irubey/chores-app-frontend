import messagesReducer, {
  addAttachment,
  deleteAttachment,
  getAttachment,
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
  createMockAttachment,
  createMockFile,
} from "../../../helpers/factories/messages/messageFactory";
import { setupMessageWithAttachmentScenario } from "../../../helpers/scenarios/messages/messageScenarios";
import { createInitialState } from "../../../helpers/utils/testUtils";

// Mock the API client
jest.mock("@/lib/api/apiClient", () => ({
  apiClient: createMockApiClient(),
}));

describe("Messages Slice - Attachment Operations", () => {
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
    it("should handle adding an attachment", async () => {
      const { message, attachments } = setupMessageWithAttachmentScenario(1);
      const file = createMockFile("test.pdf", 1024, "application/pdf");

      setupStoreWithMessages([message]);
      (
        apiClient.threads.messages.attachments.addAttachment as jest.Mock
      ).mockResolvedValue(createMockApiResponse(attachments[0]));

      await store.dispatch(
        addAttachment({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          file,
        })
      );

      const state = store.getState().messages;
      expect(state.status.attachment).toBe("succeeded");
      expect(state.messages[0].attachments).toContainEqual(
        expect.objectContaining({
          fileType: file.type,
        })
      );
      expect(state.error).toBeNull();
    });

    it("should handle deleting an attachment", async () => {
      const { message, attachments } = setupMessageWithAttachmentScenario(1);
      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.attachments.deleteAttachment as jest.Mock
      ).mockResolvedValue(createMockApiResponse(undefined));

      await store.dispatch(
        deleteAttachment({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          attachmentId: attachments[0].id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.attachment).toBe("succeeded");
      expect(state.messages[0].attachments).toHaveLength(0);
      expect(state.error).toBeNull();
    });

    it("should handle getting an attachment", async () => {
      const { message, attachments } = setupMessageWithAttachmentScenario(1);
      setupStoreWithMessages([message]);

      (
        apiClient.threads.messages.attachments.getAttachment as jest.Mock
      ).mockResolvedValue(createMockApiResponse(attachments[0]));

      await store.dispatch(
        getAttachment({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          attachmentId: attachments[0].id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.attachment).toBe("succeeded");
      expect(state.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle file size validation errors", async () => {
      const message = createMockMessageWithDetails();
      const file = createMockFile(
        "large.pdf",
        1024 * 1024 * 100,
        "application/pdf"
      );

      setupStoreWithMessages([message]);

      const error = new ApiError(
        "File too large",
        ApiErrorType.VALIDATION,
        400,
        {
          validationErrors: {
            file: ["File size must not exceed 50MB"],
          },
        }
      );

      (
        apiClient.threads.messages.attachments.addAttachment as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        addAttachment({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          file,
        })
      );

      const state = store.getState().messages;
      expect(state.status.attachment).toBe("failed");
      expect(state.error).toBe("File too large");
    });

    it("should handle unauthorized attachment operations", async () => {
      const { message, attachments } = setupMessageWithAttachmentScenario(1);
      setupStoreWithMessages([message]);

      const error = new ApiError(
        "Unauthorized to delete attachment",
        ApiErrorType.AUTHORIZATION,
        403
      );

      (
        apiClient.threads.messages.attachments.deleteAttachment as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        deleteAttachment({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          attachmentId: attachments[0].id,
        })
      );

      const state = store.getState().messages;
      expect(state.status.attachment).toBe("failed");
      expect(state.error).toBe("Unauthorized to delete attachment");
    });

    it("should handle not found errors", async () => {
      const message = createMockMessageWithDetails();
      setupStoreWithMessages([message]);

      const error = new ApiError(
        "Attachment not found",
        ApiErrorType.NOT_FOUND,
        404
      );

      (
        apiClient.threads.messages.attachments.getAttachment as jest.Mock
      ).mockRejectedValue(error);

      await store.dispatch(
        getAttachment({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          attachmentId: "non-existent",
        })
      );

      const state = store.getState().messages;
      expect(state.status.attachment).toBe("failed");
      expect(state.error).toBe("Attachment not found");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple concurrent attachment operations", async () => {
      const message = createMockMessageWithDetails();
      const files = [
        createMockFile("doc1.pdf", 1024, "application/pdf"),
        createMockFile("doc2.pdf", 2048, "application/pdf"),
      ];
      const attachments = files.map((file) =>
        createMockAttachment(message.id, { fileType: file.type })
      );

      setupStoreWithMessages([message]);

      (apiClient.threads.messages.attachments.addAttachment as jest.Mock)
        .mockResolvedValueOnce(createMockApiResponse(attachments[0]))
        .mockResolvedValueOnce(createMockApiResponse(attachments[1]));

      await Promise.all(
        files.map((file) =>
          store.dispatch(
            addAttachment({
              householdId: "household-1",
              threadId: "thread-1",
              messageId: message.id,
              file,
            })
          )
        )
      );

      const state = store.getState().messages;
      expect(state.status.attachment).toBe("succeeded");
      expect(state.messages[0].attachments).toHaveLength(2);
      expect(state.error).toBeNull();
    });

    it("should maintain attachment order after multiple operations", async () => {
      const { message, attachments } = setupMessageWithAttachmentScenario(3);
      setupStoreWithMessages([message]);

      // Delete middle attachment
      (
        apiClient.threads.messages.attachments.deleteAttachment as jest.Mock
      ).mockResolvedValue(createMockApiResponse(undefined));

      await store.dispatch(
        deleteAttachment({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          attachmentId: attachments[1].id,
        })
      );

      const state = store.getState().messages;
      expect(state.messages[0].attachments).toHaveLength(2);
      expect(state.messages[0].attachments?.[0].id).toBe(attachments[0].id);
      expect(state.messages[0].attachments?.[1].id).toBe(attachments[2].id);
    });
  });

  describe("State Transitions", () => {
    it("should handle loading states during attachment upload", async () => {
      const message = createMockMessageWithDetails();
      const file = createMockFile("test.pdf", 1024, "application/pdf");
      const attachment = createMockAttachment(message.id, {
        fileType: file.type,
      });

      setupStoreWithMessages([message]);

      let resolveUpload: (value: any) => void;
      const uploadPromise = new Promise((resolve) => {
        resolveUpload = resolve;
      });

      (
        apiClient.threads.messages.attachments.addAttachment as jest.Mock
      ).mockReturnValue(uploadPromise);

      const dispatchPromise = store.dispatch(
        addAttachment({
          householdId: "household-1",
          threadId: "thread-1",
          messageId: message.id,
          file,
        })
      );

      // Check loading state
      let state = store.getState().messages;
      expect(state.status.attachment).toBe("loading");

      // Resolve upload
      resolveUpload!(createMockApiResponse(attachment));
      await dispatchPromise;

      // Check success state
      state = store.getState().messages;
      expect(state.status.attachment).toBe("succeeded");
    });
  });
});
