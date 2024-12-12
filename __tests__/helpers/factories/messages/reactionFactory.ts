import { ReactionWithUser, CreateReactionDTO } from "@shared/types";
import { ReactionType } from "@shared/enums";
import { generateId } from "../../utils/idGenerator";
import { createMockUser } from "../userFactory";

export function createMockReaction(
  messageId: string,
  overrides: Partial<ReactionWithUser> = {}
): ReactionWithUser {
  const user = createMockUser();

  return {
    id: generateId("reaction"),
    messageId,
    userId: user.id,
    emoji: "👍",
    type: ReactionType.LIKE,
    createdAt: new Date(),
    user,
    ...overrides,
  };
}

export function createMockReactionDTO(
  overrides: Partial<CreateReactionDTO> = {}
): CreateReactionDTO {
  return {
    type: ReactionType.LIKE,
    emoji: "👍",
    ...overrides,
  };
}
