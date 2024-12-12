import { testLogger } from "../../utils/testLogger";
import { createMockApiCall } from "../../mocks/apiMocks";
import { createMockMessageWithDetails } from "../../factories/messages/messageFactory";
import { createMockAttachment } from "../../factories/messages/attachmentFactory";
import { MessageAction } from "@shared/enums";
import { generateId } from "../../utils/idGenerator";
import { MessageWithDetails, Attachment } from "@shared/types";

interface SetupMessageWithAttachmentsOptions {
  attachmentCount?: number;
  attachmentOverrides?: Partial<Attachment>;
  messageOverrides?: Partial<MessageWithDetails>;
}

export const setupMessageWithAttachmentsScenario = async ({
  attachmentCount = 1,
  attachmentOverrides = {},
  messageOverrides = {},
}: SetupMessageWithAttachmentsOptions = {}) => {
  testLogger.debug("Setting up message with attachments scenario", {
    attachmentCount,
  });

  const message = createMockMessageWithDetails({ withAttachments: true });
  const attachments = Array.from({ length: attachmentCount }, () =>
    createMockAttachment(message.id, attachmentOverrides)
  );

  const updatedMessage: MessageWithDetails = {
    ...message,
    ...messageOverrides,
    attachments,
  };

  return {
    message: updatedMessage,
    attachments,
    response: await createMockApiCall(updatedMessage),
  };
};

export const setupAttachmentUpdateEventScenario = ({
  action,
}: {
  action: MessageAction.ATTACHMENT_ADDED | MessageAction.ATTACHMENT_REMOVED;
}) => {
  testLogger.debug("Setting up attachment update event scenario", { action });

  const messageId = generateId("message");
  const attachment =
    action === MessageAction.ATTACHMENT_ADDED
      ? createMockAttachment(messageId)
      : undefined;
  const attachmentId =
    action === MessageAction.ATTACHMENT_REMOVED
      ? generateId("attachment")
      : undefined;

  return {
    event: {
      action,
      messageId,
      attachment,
      attachmentId,
    },
  };
};
