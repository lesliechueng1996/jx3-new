import {
  type AuthProvider,
  authProviders,
  roleAdmin,
  roleUser,
} from '@api/shared/util/auth';
import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';

export const listUsersQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    name: t.Optional(t.String()),
    email: t.Optional(t.String()),
    role: t.Optional(
      t.Enum(
        {
          [roleAdmin]: roleAdmin,
          [roleUser]: roleUser,
        },
        {
          error: () => '角色不正确',
        },
      ),
    ),
    banned: t.Optional(t.Boolean()),
    provider: t.Optional(
      t.Enum(
        authProviders.reduce(
          (acc, provider) => {
            acc[provider] = provider;
            return acc;
          },
          {} as Record<AuthProvider, AuthProvider>,
        ),
        {
          error: () => '认证提供者不正确',
        },
      ),
    ),
  }),
]);

export type ListUsersQuery = Static<typeof listUsersQuerySchema>;

export const listUsersResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        emailMasked: t.String(),
        role: t.Nullable(t.String()),
        banned: t.Boolean(),
        banReason: t.Nullable(t.String()),
        banDate: t.Nullable(t.String()),
        lastLoginIp: t.Nullable(t.String()),
        providers: t.Array(t.String()),
        createdAt: t.String(),
      }),
    ),
  }),
]);

export type ListUsersItem = Static<
  typeof listUsersResponseSchema
>['items'][number];
