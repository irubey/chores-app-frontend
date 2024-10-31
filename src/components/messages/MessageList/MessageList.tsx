import { Message } from "@shared/types";

//Purpose:Displays all messages within a selected thread in a scrollable container, handling the rendering of individual messages.
interface MessageListProps {
  messages: Message[];
  onLoadMore: () => void;
}
