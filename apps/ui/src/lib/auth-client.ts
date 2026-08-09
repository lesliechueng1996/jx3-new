import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { apiBaseUrl } from './api-client';

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [adminClient()],
});

export const ROLE_ADMIN = 'admin';
export const ROLE_USER = 'user';
