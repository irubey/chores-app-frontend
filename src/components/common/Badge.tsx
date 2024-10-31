//Purpose:Small indicators for statuses or counts, such as unread messages or notifications.
interface BadgeProps {
  count: number;
  showZero?: boolean;
  children: React.ReactNode;
}
