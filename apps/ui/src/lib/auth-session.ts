import { queryOptions } from '@tanstack/react-query';
import { authClient } from './auth-client';
import { queryClient } from './query-client';

export const sessionQueryKey = ['auth', 'session'] as const;

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: async () => {
    const { data } = await authClient.getSession();
    return data;
  },
  staleTime: 60_000,
});

export async function fetchCachedSession() {
  return queryClient.fetchQuery(sessionQueryOptions);
}

export function clearSessionQuery() {
  queryClient.removeQueries({ queryKey: sessionQueryKey });
}

type CachedSession = NonNullable<
  Awaited<ReturnType<typeof fetchCachedSession>>
>;

export function patchCachedSessionUser(patch: Partial<CachedSession['user']>) {
  queryClient.setQueryData(
    sessionQueryKey,
    (current: CachedSession | null | undefined) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        user: {
          ...current.user,
          ...patch,
        },
      };
    },
  );
}
