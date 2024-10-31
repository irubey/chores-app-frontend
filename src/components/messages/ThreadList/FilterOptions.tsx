//Purpose:Provides options to filter threads based on criteria like unread, recent, or specific users.
interface FilterOptionsProps {
  filters: Array<{ label: string; value: string }>;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}
