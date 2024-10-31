//Purpose:Global navigation bar containing logo, search bar, and user profile options
interface HeaderProps {
  logo: React.ReactNode;
  onSearch: (query: string) => void;
  userAvatar: string;
  onProfileClick: () => void;
}
