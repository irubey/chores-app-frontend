//Purpose:Displays user avatars with optional fallback images or initials.
interface AvatarProps {
  src?: string;
  alt: string;
  size?: "small" | "medium" | "large";
  fallback?: string;
}
