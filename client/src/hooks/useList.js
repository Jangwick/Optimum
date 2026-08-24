import { useState, useCallback } from 'react';

export function useList({ initialPage = 1, initialLimit = 25, initialSearch = '' } = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [refresh, setRefresh] = useState(0);

  const onSort = useCallback((field) => {
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

  const applySearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const applyFilters = useCallback((next) => {
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
