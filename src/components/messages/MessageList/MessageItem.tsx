//Purpose:Represents an individual message, displaying content, author information, timestamp, reactions, and attachments.

import { Message, User } from "@shared/types";
import { ReactionType } from "@shared/enums";

interface MessageItemProps {
  message: Message;
  currentUser: User;
  onReact: (messageId: string, reactionType: ReactionType) => void;
  onReply: (messageId: string) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}
