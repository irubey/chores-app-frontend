import { ReactionType } from "@shared/enums";

//Purpose:Allows users to add reactions (e.g., like, love) to messages.
interface ReactionPickerProps {
  messageId: string;
  onSelectReaction: (reactionType: ReactionType) => void;
}
