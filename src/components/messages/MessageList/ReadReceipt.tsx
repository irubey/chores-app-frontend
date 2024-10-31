import { User } from "@shared/types";

//Purpose:Shows indicators for whether a message has been read by other participants.
interface ReadReceiptProps {
  messageId: string;
  readers: User[];
}
