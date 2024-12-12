import { Attachment } from "@shared/types";
import { generateId } from "../../utils/idGenerator";

export function createMockAttachment(
  messageId: string,
  overrides: Partial<Attachment> = {}
): Attachment {
  return {
    id: generateId("attachment"),
    messageId,
    url: "https://example.com/file.pdf",
    fileType: "application/pdf",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
