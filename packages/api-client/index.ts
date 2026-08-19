import { treaty } from '@elysia/eden';
import type { App } from '@jx3/api';

export const createApiClient = (apiHost?: string) => {
  const baseUrl = apiHost ?? 'http://localhost:3001';

  return treaty<App>(baseUrl, {
    parseDate: false,
    fetch: {
      credentials: 'include',
    },
  });
};

export type ApiClient = ReturnType<typeof createApiClient>;
