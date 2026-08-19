import { logger } from '@api/infrastructure/logger';
import { accountRepository } from '@api/infrastructure/repository/account-repository';
import { sessionRepository } from '@api/infrastructure/repository/session-repository';
import { userRepository } from '@api/infrastructure/repository/user-repository';
import type {
  AdminUserDetail,
  BanUserBody,
  CreateUserBody,
  ListUsersItem,
  ListUsersQuery,
  UpdateUserBody,
} from '@api/interface/schema/user-schema';
import {
  ConflictException,
  ERROR_CODES,
  ForbiddenException,
  NotFoundException,
} from '@api/shared/exception';
import {
  auth,
  normalizeProviders,
  roleAdmin,
  roleUser,
} from '@api/shared/util/auth';
import { formatDateTime } from '@api/shared/util/date';
import { maskEmail } from '@api/shared/util/email';

type UserRow = NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>;

const AUTH_EMAIL_CONFLICT_CODES = new Set([
  'USER_ALREADY_EXISTS',
  'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
]);

const getBetterAuthErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const withBody = error as { body?: { code?: unknown } };
  if (typeof withBody.body?.code === 'string') {
    return withBody.body.code;
  }

  const withCode = error as { code?: unknown };
  if (typeof withCode.code === 'string') {
    return withCode.code;
  }

  return undefined;
};

const rethrowAuthAdminError = (error: unknown): never => {
  const code = getBetterAuthErrorCode(error);
  if (code && AUTH_EMAIL_CONFLICT_CODES.has(code)) {
    throw new ConflictException(
      '邮箱已被使用',
      ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
    );
  }
  throw error;
};

const callAuthAdmin = async <T>(
  action: string,
  fn: () => Promise<T>,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    logger.error('{action} failed, {error}', { action, error });
    return rethrowAuthAdminError(error);
  }
};

const toAdminUserDetail = async (row: UserRow): Promise<AdminUserDetail> => {
  const [accounts, sessions] = await Promise.all([
    accountRepository.findAccountsByUserIds([row.id]),
    sessionRepository.findSessionsByUserIds([row.id]),
  ]);

  return {
    id: row.id,
    name: row.name,
    emailMasked: maskEmail(row.email),
    role: row.role ?? null,
    banned: row.banned ?? false,
    banReason: row.banReason ?? null,
    banExpires: row.banExpires ? row.banExpires.toISOString() : null,
    lastLoginIp: sessions[0]?.ipAddress ?? null,
    providers: normalizeProviders(
      accounts.map((account) => account.providerId),
    ),
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt),
  };
};

const findUserOrThrow = async (id: string): Promise<UserRow> => {
  const row = await userRepository.findById(id);
  if (!row) {
    throw new NotFoundException('用户不存在', ERROR_CODES.USER_NOT_FOUND);
  }
  return row;
};

const assertCanBanOrDelete = (target: UserRow, actorId: string) => {
  if (target.id === actorId) {
    throw new ForbiddenException(
      '不能对自己执行该操作',
      ERROR_CODES.USER_CANNOT_OPERATE_SELF,
    );
  }

  if (target.role === roleAdmin) {
    throw new ForbiddenException(
      '不能封禁或删除其他管理员',
      ERROR_CODES.USER_CANNOT_MODIFY_ADMIN,
    );
  }
};

export const listAdminUsers = async (
  query: ListUsersQuery,
): Promise<{
  items: ListUsersItem[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = userRepository.buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    userRepository.listPagination(where, query.pageSize, offset),
    userRepository.count(where),
  ]);

  const userIds = rows.map((row) => row.id);
  if (userIds.length === 0) {
    return {
      items: [],
      total: totalRows[0]?.total ?? 0,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  const [accounts, sessions] = await Promise.all([
    accountRepository.findAccountsByUserIds(userIds),
    sessionRepository.findSessionsByUserIds(userIds),
  ]);

  const providersByUser = new Map<string, string[]>();
  for (const row of accounts) {
    const existing = providersByUser.get(row.userId) ?? [];
    existing.push(row.providerId);
    providersByUser.set(row.userId, existing);
  }

  const lastLoginIpByUser = new Map<string, string | null>();
  for (const row of sessions) {
    if (!lastLoginIpByUser.has(row.userId)) {
      lastLoginIpByUser.set(row.userId, row.ipAddress ?? null);
    }
  }

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      emailMasked: maskEmail(row.email),
      role: row.role ?? null,
      banned: row.banned ?? false,
      banReason: row.banReason ?? null,
      banDate: row.banned ? row.updatedAt.toISOString() : null,
      lastLoginIp: lastLoginIpByUser.get(row.id) ?? null,
      providers: normalizeProviders(providersByUser.get(row.id) ?? []),
      createdAt: formatDateTime(row.createdAt),
    })),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminUser = async (id: string): Promise<AdminUserDetail> => {
  const row = await findUserOrThrow(id);
  return toAdminUserDetail(row);
};

export const createAdminUser = async (
  body: CreateUserBody,
  headers: Headers,
): Promise<AdminUserDetail> => {
  const created = await callAuthAdmin('Create user', () =>
    auth.api.createUser({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
        role: body.role ?? roleUser,
      },
      headers,
    }),
  );

  return getAdminUser(created.user.id);
};

export const updateAdminUser = async (
  id: string,
  body: UpdateUserBody,
  actorId: string,
  headers: Headers,
): Promise<AdminUserDetail> => {
  await findUserOrThrow(id);

  if (body.role !== undefined && id === actorId) {
    throw new ForbiddenException(
      '不能修改自己的角色',
      ERROR_CODES.USER_CANNOT_OPERATE_SELF,
    );
  }

  const profile: Record<string, string> = {};
  if (body.name !== undefined) {
    profile.name = body.name;
  }
  if (body.email !== undefined) {
    profile.email = body.email;
  }

  await callAuthAdmin('Update user', async () => {
    if (Object.keys(profile).length > 0) {
      await auth.api.adminUpdateUser({
        body: { userId: id, data: profile },
        headers,
      });
    }

    if (body.role !== undefined) {
      await auth.api.setRole({
        body: { userId: id, role: body.role },
        headers,
      });
    }

    if (body.password !== undefined) {
      await auth.api.setUserPassword({
        body: { userId: id, newPassword: body.password },
        headers,
      });
    }
  });

  return getAdminUser(id);
};

export const deleteAdminUser = async (
  id: string,
  actorId: string,
  headers: Headers,
): Promise<void> => {
  const target = await findUserOrThrow(id);
  assertCanBanOrDelete(target, actorId);

  await callAuthAdmin('Delete user', () =>
    auth.api.removeUser({
      body: { userId: id },
      headers,
    }),
  );
};

export const banAdminUser = async (
  id: string,
  body: BanUserBody,
  actorId: string,
  headers: Headers,
): Promise<AdminUserDetail> => {
  const target = await findUserOrThrow(id);
  assertCanBanOrDelete(target, actorId);

  await callAuthAdmin('Ban user', () =>
    auth.api.banUser({
      body: {
        userId: id,
        banReason: body.reason,
        ...(body.banExpiresIn !== undefined
          ? { banExpiresIn: body.banExpiresIn }
          : {}),
      },
      headers,
    }),
  );

  return getAdminUser(id);
};

export const unbanAdminUser = async (
  id: string,
  headers: Headers,
): Promise<AdminUserDetail> => {
  await findUserOrThrow(id);

  await callAuthAdmin('Unban user', () =>
    auth.api.unbanUser({
      body: { userId: id },
      headers,
    }),
  );

  return getAdminUser(id);
};
