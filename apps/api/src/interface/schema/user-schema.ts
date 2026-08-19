import {
  type AuthProvider,
  authProviders,
  roleAdmin,
  roleUser,
} from '@api/shared/util/auth';
import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';

const userRoleSchema = t.Enum(
  {
    [roleAdmin]: roleAdmin,
    [roleUser]: roleUser,
  },
  {
    error: () => '角色不正确',
  },
);

export const listUsersQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    name: t.Optional(t.String()),
    email: t.Optional(t.String()),
    role: t.Optional(userRoleSchema),
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

export const userIdParamsSchema = t.Object({
  id: t.String({
    minLength: 1,
    error: () => '用户ID不正确',
  }),
});

export const adminUserDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  emailMasked: t.String(),
  role: t.Nullable(t.String()),
  banned: t.Boolean(),
  banReason: t.Nullable(t.String()),
  banExpires: t.Nullable(t.String()),
  lastLoginIp: t.Nullable(t.String()),
  providers: t.Array(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type AdminUserDetail = Static<typeof adminUserDetailSchema>;

export const createUserBodySchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '用户名长度须为1-64个字符',
  }),
  email: t.String({
    format: 'email',
    error: () => '邮箱格式不正确',
  }),
  password: t.String({
    minLength: 8,
    error: () => '密码至少8位',
  }),
  role: t.Optional(userRoleSchema),
});

export type CreateUserBody = Static<typeof createUserBodySchema>;

export const updateUserBodySchema = t.Object(
  {
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 64,
        error: () => '用户名长度须为1-64个字符',
      }),
    ),
    email: t.Optional(
      t.String({
        format: 'email',
        error: () => '邮箱格式不正确',
      }),
    ),
    role: t.Optional(userRoleSchema),
    password: t.Optional(
      t.String({
        minLength: 8,
        error: () => '密码至少8位',
      }),
    ),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateUserBody = Static<typeof updateUserBodySchema>;

export const banUserBodySchema = t.Object({
  reason: t.String({
    minLength: 1,
    maxLength: 200,
    error: () => '封禁原因长度须为1-200个字符',
  }),
  banExpiresIn: t.Optional(
    t.Integer({
      minimum: 1,
      error: () => '封禁时长须为正整数秒',
    }),
  ),
});

export type BanUserBody = Static<typeof banUserBodySchema>;
