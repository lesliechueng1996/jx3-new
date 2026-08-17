import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, fetchQuery, removeQueries } = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetchQuery: vi.fn(),
  removeQueries: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession,
  },
  ROLE_ADMIN: 'admin',
  ROLE_USER: 'user',
}));

vi.mock('@/lib/query-client', () => ({
  queryClient: {
    fetchQuery,
    removeQueries,
  },
}));

describe('auth-session', () => {
  beforeEach(() => {
    getSession.mockReset();
    fetchQuery.mockReset();
    removeQueries.mockReset();
  });

  it('fetches the cached session through react-query', async () => {
    const session = { user: { id: '1' } };
    fetchQuery.mockResolvedValue(session);

    const { fetchCachedSession, sessionQueryKey, sessionQueryOptions } =
      await import('@/lib/auth-session');

    expect(sessionQueryKey).toEqual(['auth', 'session']);
    expect(sessionQueryOptions.queryKey).toEqual(sessionQueryKey);

    getSession.mockResolvedValue({ data: session });
    const queryFn = sessionQueryOptions.queryFn;
    if (typeof queryFn !== 'function') {
      throw new Error('missing session queryFn');
    }
    await expect(queryFn({} as never)).resolves.toEqual(session);

    await expect(fetchCachedSession()).resolves.toEqual(session);
    expect(fetchQuery).toHaveBeenCalledWith(sessionQueryOptions);
  });

  it('clears the session query', async () => {
    const { clearSessionQuery, sessionQueryKey } = await import(
      '@/lib/auth-session'
    );
    clearSessionQuery();
    expect(removeQueries).toHaveBeenCalledWith({ queryKey: sessionQueryKey });
  });
});
