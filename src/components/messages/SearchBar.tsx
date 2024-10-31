//Purpose:Enables searching through threads or messages within the app.
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}
