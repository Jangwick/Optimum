import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';

interface UseListOptions {
  initialPage?: number;
  initialLimit?: number;
}

interface UseListFilters {
  [key: string]: unknown;
}

interface UseListState {
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  limit: number;
  setLimit: Dispatch<SetStateAction<number>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  applySearch: (value: string) => void;
  filters: UseListFilters;
  setFilters: Dispatch<SetStateAction<UseListFilters>>;
  applyFilters: (next: UseListFilters) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  refresh: number;
  reload: () => void;
}

export function useList({ initialPage = 1, initialLimit = 25 }: UseListOptions = {}): UseListState {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<UseListFilters>({});
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [refresh, setRefresh] = useState(0);

  const onSort = useCallback((field: string) => {
    setSortField((current) => {
      if (current === field) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrder('asc');
      return field;
    });
    setPage(1);
  }, []);

  const applySearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const applyFilters = useCallback((next: UseListFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  const reload = useCallback(() => setRefresh((n) => n + 1), []);

  return {
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    applySearch,
    filters,
    setFilters,
    applyFilters,
    sortField,
    sortOrder,
    onSort,
    refresh,
    reload,
  };
}
