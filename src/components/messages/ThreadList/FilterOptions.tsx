import { Household } from "@shared/types";

//Purpose:Provides options to filter threads based on criteria like unread, recent, or specific users, or households.
interface FilterOptionsProps {
  filters: Array<{ label: string; value: string }>;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  households: Household[];
}
