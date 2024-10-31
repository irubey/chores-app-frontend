//Purpose:Switchable sections within a page for organizing different content areas.
interface TabsProps {
  activeKey: string;
  onTabChange: (key: string) => void;
  tabs: Array<{ key: string; label: string; content: React.ReactNode }>;
}
