import { testLogger } from "../../utils/testLogger";
import { createMockApiCall } from "../../mocks/apiMocks";
import { createMockMessageWithDetails } from "../../factories/messages/messageFactory";
import { createMockMention } from "../../factories/messages/mentionFactory";
import { MessageAction } from "@shared/enums";
import { generateId } from "../../utils/idGenerator";
import { MessageWithDetails, MentionWithUser } from "@shared/types";

interface SetupMessageWithMentionsOptions {
  mentionCount?: number;
  mentionOverrides?: Partial<MentionWithUser>;
  messageOverrides?: Partial<MessageWithDetails>;
}

export const setupMessageWithMentionsScenario = async ({
  mentionCount = 1,
  mentionOverrides = {},
  messageOverrides = {},
}: SetupMessageWithMentionsOptions = {}) => {
  testLogger.debug("Setting up message with mentions scenario", {
    mentionCount,
  });

  const message = createMockMessageWithDetails({ withMentions: true });
  const mentions = Array.from({ length: mentionCount }, () =>
    createMockMention(message.id, mentionOverrides)
  );

  const updatedMessage: MessageWithDetails = {
    ...message,
    ...messageOverrides,
    mentions,
  };

  return {
    message: updatedMessage,
    mentions,
    response: await createMockApiCall(updatedMessage),
  };
};

export const setupMentionUpdateEventScenario = ({
  messageId = generateId("message"),
}: {
  messageId?: string;
}) => {
  testLogger.debug("Setting up mention update event scenario");

  return {
    event: {
      action: MessageAction.MENTIONED,
      messageId,
      mention: createMockMention(messageId),
    },
  };
};
