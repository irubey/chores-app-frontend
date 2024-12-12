import { MentionWithUser, CreateMentionDTO } from "@shared/types";
import { generateId } from "../../utils/idGenerator";
import { createMockUser } from "../userFactory";

export function createMockMention(
  messageId: string,
  overrides: Partial<MentionWithUser> = {}
): MentionWithUser {
  const user = createMockUser();
  return {
    id: generateId("mention"),
    messageId,
    userId: user.id,
    mentionedAt: new Date(),
    user,
    ...overrides,
  };
}

export function createMockMentionDTO(
  overrides: Partial<CreateMentionDTO> = {}
): CreateMentionDTO {
  return {
    userId: generateId("user"),
    ...overrides,
  };
}
