import { accountRepository } from '@api/infrastructure/repository/account-repository';
import { sessionRepository } from '@api/infrastructure/repository/session-repository';
import { userRepository } from '@api/infrastructure/repository/user-repository';
import type {
  ListUsersItem,
  ListUsersQuery,
} from '@api/interface/schema/user-schema';
import { normalizeProviders } from '@api/shared/util/auth';
import { formatDateTime } from '@api/shared/util/date';
import { maskEmail } from '@api/shared/util/email';

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
