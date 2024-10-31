import { Mention } from "@shared/types";

//Purpose:Highlights mentioned users within messages and provides navigation to their profiles.
interface MentionHighlightProps {
  content: string;
  mentions: Mention[];
}
