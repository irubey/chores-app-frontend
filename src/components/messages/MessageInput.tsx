//Purpose:Text area for composing and sending new messages, including options for attachments and mentions.
interface MessageInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  onMention: (userId: string) => void;
}
