//Purpose:Container for grouping related content, such as thread summaries or user profiles.
interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
}
