import { type QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DEFAULT_PAGE, type PaginationSearchQuery } from '@/lib/pagination';
import { toRouteSearch } from '@/lib/utils';

export type PaginatedList<TItem> = {
  items: TItem[];
  total: number;
};

export type PaginationProps = {
  total: number;
  page: number;
  totalPages: number;
  isPreviousPageDisabled: boolean;
  isNextPageDisabled: boolean;
  onPageChange: (page: number) => void;
};

type RouteSearchValue<TSearch extends PaginationSearchQuery> = {
  [K in keyof TSearch]: TSearch[K] | undefined;
};

type UsePaginatedQueryOptions<TSearch extends PaginationSearchQuery, TItem> = {
  queryKey: QueryKey;
  search: TSearch;
  defaults: TSearch;
  navigate: (opts: { search: RouteSearchValue<TSearch> }) => unknown;
  queryFn: (search: TSearch) => Promise<PaginatedList<TItem>>;
  enabled?: boolean;
};

export function usePaginatedQuery<
  TSearch extends PaginationSearchQuery,
  TItem,
>({
  queryKey,
  search,
  defaults,
  navigate,
  queryFn,
  enabled = true,
}: UsePaginatedQueryOptions<TSearch, TItem>) {
  const queryClient = useQueryClient();
  const fullQueryKey = [...queryKey, search] as const;

  const query = useQuery({
    queryKey: fullQueryKey,
    queryFn: () => queryFn(search),
    enabled,
  });

  const setSearch = (next: TSearch) => {
    navigate({
      search: toRouteSearch(next, defaults),
    });
  };

  const setPage = (page: number) => {
    setSearch({ ...search, page });
  };

  const setFilters = (partial: Partial<TSearch>) => {
    setSearch({
      ...search,
      ...partial,
      page: DEFAULT_PAGE,
    });
  };

  const resetSearch = () => {
    setSearch(defaults);
  };

  const total = query.data?.total ?? 0;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / search.pageSize)),
    [search.pageSize, total],
  );

  const paginationProps: PaginationProps = {
    total,
    page: search.page,
    totalPages,
    isPreviousPageDisabled: search.page <= 1 || query.isFetching,
    isNextPageDisabled: search.page >= totalPages || query.isFetching,
    onPageChange: setPage,
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    search,
    query,
    items: query.data?.items ?? [],
    total,
    totalPages,
    isFetching: query.isFetching,
    isError: query.isError,
    setSearch,
    setPage,
    setFilters,
    resetSearch,
    paginationProps,
    invalidate,
    queryKey,
  };
}
