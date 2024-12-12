import { testLogger } from "../../utils/testLogger";
import { createMockApiCall } from "../../mocks/apiMocks";
import { createMockMessageWithDetails } from "../../factories/messages/messageFactory";
import { createMockReaction } from "../../factories/messages/reactionFactory";
import { MessageAction } from "@shared/enums";
import { generateId } from "../../utils/idGenerator";
import { MessageWithDetails, ReactionWithUser } from "@shared/types";

interface SetupMessageWithReactionsOptions {
  reactionCount?: number;
  reactionOverrides?: Partial<ReactionWithUser>;
  messageOverrides?: Partial<MessageWithDetails>;
}

export const setupMessageWithReactionsScenario = async ({
  reactionCount = 1,
  reactionOverrides = {},
  messageOverrides = {},
}: SetupMessageWithReactionsOptions = {}) => {
  testLogger.debug("Setting up message with reactions scenario", {
    reactionCount,
  });

  const message = createMockMessageWithDetails({ withReactions: true });
  const reactions = Array.from({ length: reactionCount }, () =>
    createMockReaction(message.id, reactionOverrides)
  );

  const updatedMessage: MessageWithDetails = {
    ...message,
    ...messageOverrides,
    reactions,
  };

  return {
    message: updatedMessage,
    reactions,
    response: await createMockApiCall(updatedMessage),
  };
};

export const setupReactionUpdateEventScenario = ({
  action,
}: {
  action: MessageAction.REACTION_ADDED | MessageAction.REACTION_REMOVED;
}) => {
  testLogger.debug("Setting up reaction update event scenario", { action });

  const messageId = generateId("message");
  const reaction =
    action === MessageAction.REACTION_ADDED
      ? createMockReaction(messageId)
      : undefined;
  const reactionId =
    action === MessageAction.REACTION_REMOVED
      ? generateId("reaction")
      : undefined;

  return {
    event: {
      action,
      messageId,
      reaction,
      reactionId,
    },
  };
};
