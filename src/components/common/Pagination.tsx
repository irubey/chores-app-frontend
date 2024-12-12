//Purpose:Controls for navigating through paginated content such as message threads or lists.
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
