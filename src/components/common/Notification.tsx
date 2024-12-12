//Purpose:Displays toast notifications for success, error, warning, and info messages.
interface NotificationProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
  onClose?: () => void;
}
