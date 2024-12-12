import { testLogger } from "../../utils/testLogger";
import { createMockApiResponse, createMockApiCall } from "../../mocks/apiMocks";
import {
  createMockMessage,
  createMockMessageWithDetails,
} from "../../factories/messages/messageFactory";
import { generateId } from "../../utils/idGenerator";
import { MessageWithDetails, Attachment } from "@shared/types";
import { MessageAction } from "@shared/enums/messages";
import { ApiError } from "@/lib/api/errors";

interface SetupMessageListOptions {
  count?: number;
  hasMore?: boolean;
  nextCursor?: string;
  withAttachments?: boolean;
  withReactions?: boolean;
  withMentions?: boolean;
}

interface MockEndpointConfig {
  shouldSucceed?: boolean;
  delay?: number;
  error?: ApiError;
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
  status?: number;
}

export const setupMessageListScenario = async ({
  count = 3,
  hasMore = false,
  nextCursor,
  withAttachments = false,
  withReactions = false,
  withMentions = false,
}: SetupMessageListOptions = {}) => {
  testLogger.debug("Setting up message list scenario", {
    count,
    hasMore,
    nextCursor,
    withAttachments,
    withReactions,
    withMentions,
  });

  const messages = Array.from({ length: count }, () =>
    createMockMessageWithDetails({
      withAttachments,
      withReactions,
      withMentions,
    })
  );

  const response = await createMockApiCall(messages, {
    shouldSucceed: true,
    pagination: { hasMore, nextCursor },
  });

  response.status = 200;

  return { messages, response };
};

interface SetupMessageUpdateEventOptions {
  action: MessageAction;
  includeDetails?: boolean;
  messageOverrides?: Partial<MessageWithDetails>;
}

export const setupMessageUpdateEventScenario = ({
  action,
  includeDetails = true,
  messageOverrides = {},
}: SetupMessageUpdateEventOptions) => {
  testLogger.debug("Setting up message update event scenario", {
    action,
    includeDetails,
  });

  const message = includeDetails
    ? createMockMessageWithDetails({}, messageOverrides)
    : undefined;

  return {
    event: {
      action,
      message,
      messageId:
        action === MessageAction.DELETED ? generateId("message") : undefined,
    },
  };
};
