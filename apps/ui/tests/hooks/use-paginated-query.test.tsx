import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { DEFAULT_PAGE } from '@/lib/pagination';

const defaults = {
  page: 1,
  pageSize: 20,
  text: undefined as string | undefined,
};

describe('usePaginatedQuery', () => {
  it('loads items, paginates, resets filters, and invalidates', async () => {
    const queryFn = vi.fn(async (search: typeof defaults) => ({
      items: [{ id: search.page }],
      total: 45,
    }));
    const navigate = vi.fn();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    function useHarness() {
      const [search, setSearchState] = useState(defaults);
      const result = usePaginatedQuery({
        queryKey: ['idioms'],
        search,
        defaults,
        navigate: (opts) => {
          navigate(opts);
          setSearchState({
            page: opts.search.page ?? defaults.page,
            pageSize: opts.search.pageSize ?? defaults.pageSize,
            text: opts.search.text,
          });
        },
        queryFn,
      });
      return result;
    }

    const { result } = renderHook(() => useHarness(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: 1 }]);
    });

    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginationProps.isPreviousPageDisabled).toBe(true);
    expect(result.current.paginationProps.isNextPageDisabled).toBe(false);

    result.current.setPage(2);
    expect(navigate).toHaveBeenCalledWith({
      search: { page: 2, pageSize: undefined, text: undefined },
    });

    await waitFor(() => {
      expect(result.current.search.page).toBe(2);
    });

    result.current.setFilters({ text: '一' });
    expect(navigate).toHaveBeenCalledWith({
      search: { page: undefined, pageSize: undefined, text: '一' },
    });
    expect(DEFAULT_PAGE).toBe(1);

    result.current.resetSearch();
    expect(navigate).toHaveBeenLastCalledWith({
      search: { page: undefined, pageSize: undefined, text: undefined },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    await result.current.invalidate();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['idioms'] });
  });

  it('uses a single page when total is 0 and respects enabled', async () => {
    const queryFn = vi.fn(async () => ({ items: [], total: 0 }));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['empty'],
          search: defaults,
          defaults,
          navigate: vi.fn(),
          queryFn,
          enabled: false,
        }),
      { wrapper: Wrapper },
    );

    expect(result.current.items).toEqual([]);
    expect(result.current.totalPages).toBe(1);
    expect(queryFn).not.toHaveBeenCalled();
  });
});
