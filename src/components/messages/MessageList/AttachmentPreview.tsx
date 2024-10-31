import { Attachment } from "@shared/types";

//Purpose:Displays previews of attached files within messages, such as images or documents.
interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (attachmentId: string) => void;
}
