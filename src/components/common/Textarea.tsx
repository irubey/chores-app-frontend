// Purpose:Multi-line text input for longer content entries like message bodies or descriptions.
interface TextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
  disabled?: boolean;
}
