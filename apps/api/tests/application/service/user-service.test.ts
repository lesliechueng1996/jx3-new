import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ListUsersQuery } from '@api/interface/schema/user-schema';

type UserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AccountRow = {
  userId: string;
  providerId: string;
};

type SessionRow = {
  userId: string;
  ipAddress: string | null | undefined;
  createdAt: Date;
};

const buildWhereClause = mock<(query: ListUsersQuery) => unknown>(
  () => undefined,
);
const listPagination = mock<
  (where: unknown, limit: number, offset: number) => Promise<UserRow[]>
>(() => Promise.resolve([]));
const count = mock<(where: unknown) => Promise<Array<{ total: number }>>>(() =>
  Promise.resolve([{ total: 0 }]),
);
const findAccountsByUserIds = mock<
  (userIds: string[]) => Promise<AccountRow[]>
>(() => Promise.resolve([]));
const findSessionsByUserIds = mock<
  (userIds: string[]) => Promise<SessionRow[]>
>(() => Promise.resolve([]));
const normalizeProviders = mock<(ids: string[]) => string[]>((ids) => ids);
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);
const maskEmail = mock<(email: string) => string>((email) => `masked:${email}`);

mock.module('@api/infrastructure/repository/user-repository', () => ({
  userRepository: {
    buildWhereClause,
    listPagination,
    count,
  },
}));

mock.module('@api/infrastructure/repository/account-repository', () => ({
  accountRepository: {
    findAccountsByUserIds,
  },
}));

mock.module('@api/infrastructure/repository/session-repository', () => ({
  sessionRepository: {
    findSessionsByUserIds,
  },
}));

mock.module('@api/shared/util/auth', () => ({
  normalizeProviders,
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

mock.module('@api/shared/util/email', () => ({
  maskEmail,
}));

const { listAdminUsers } = await import(
  '@api/application/service/user-service'
);

const createdAt = new Date('2026-01-15T08:00:00.000Z');
const updatedAt = new Date('2026-02-01T12:00:00.000Z');
const whereClause = { kind: 'where' };

const query: ListUsersQuery = {
  page: 2,
  pageSize: 10,
  name: 'ali',
};

const makeUser = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  emailVerified: true,
  image: null,
  role: 'admin',
  banned: false,
  banReason: null,
  banExpires: null,
  createdAt,
  updatedAt,
  ...overrides,
});

describe('listAdminUsers', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    listPagination.mockReset();
    count.mockReset();
    findAccountsByUserIds.mockReset();
    findSessionsByUserIds.mockReset();
    normalizeProviders.mockReset();
    formatDateTime.mockReset();
    maskEmail.mockReset();

    buildWhereClause.mockReturnValue(whereClause);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
    findAccountsByUserIds.mockResolvedValue([]);
    findSessionsByUserIds.mockResolvedValue([]);
    normalizeProviders.mockImplementation((ids: string[]) =>
      ids.map((id) => `n:${id}`),
    );
    formatDateTime.mockImplementation(
      (date: Date) => `fmt:${date.toISOString()}`,
    );
    maskEmail.mockImplementation((email: string) => `masked:${email}`);
  });

  it('returns an empty page without loading accounts or sessions', async () => {
    count.mockResolvedValue([{ total: 7 }]);

    const result = await listAdminUsers(query);

    expect(buildWhereClause).toHaveBeenCalledWith(query);
    expect(listPagination).toHaveBeenCalledWith(whereClause, 10, 10);
    expect(count).toHaveBeenCalledWith(whereClause);
    expect(findAccountsByUserIds).not.toHaveBeenCalled();
    expect(findSessionsByUserIds).not.toHaveBeenCalled();
    expect(result).toEqual({
      items: [],
      total: 7,
      page: 2,
      pageSize: 10,
    });
  });

  it('treats a missing count row as total 0 on the empty path', async () => {
    count.mockResolvedValue([]);

    const result = await listAdminUsers(query);

    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('maps users with providers, last login ip, and optional fields', async () => {
    const alice = makeUser();
    const bob = makeUser({
      id: 'user-2',
      name: 'Bob',
      email: 'bob@example.com',
      role: null,
      banned: null,
      banReason: null,
    });

    listPagination.mockResolvedValue([alice, bob]);
    count.mockResolvedValue([{ total: 2 }]);
    findAccountsByUserIds.mockResolvedValue([
      { userId: 'user-1', providerId: 'credential' },
      { userId: 'user-1', providerId: 'credential' },
      { userId: 'user-2', providerId: 'credential' },
    ]);
    findSessionsByUserIds.mockResolvedValue([
      { userId: 'user-1', ipAddress: '1.1.1.1', createdAt },
      { userId: 'user-1', ipAddress: '8.8.8.8', createdAt },
      { userId: 'user-2', ipAddress: undefined, createdAt },
    ]);

    const result = await listAdminUsers(query);

    expect(findAccountsByUserIds).toHaveBeenCalledWith(['user-1', 'user-2']);
    expect(findSessionsByUserIds).toHaveBeenCalledWith(['user-1', 'user-2']);
    expect(maskEmail).toHaveBeenCalledWith('alice@example.com');
    expect(normalizeProviders).toHaveBeenCalledWith([
      'credential',
      'credential',
    ]);
    expect(result).toEqual({
      items: [
        {
          id: 'user-1',
          name: 'Alice',
          emailMasked: 'masked:alice@example.com',
          role: 'admin',
          banned: false,
          banReason: null,
          banDate: null,
          lastLoginIp: '1.1.1.1',
          providers: ['n:credential', 'n:credential'],
          createdAt: `fmt:${createdAt.toISOString()}`,
        },
        {
          id: 'user-2',
          name: 'Bob',
          emailMasked: 'masked:bob@example.com',
          role: null,
          banned: false,
          banReason: null,
          banDate: null,
          lastLoginIp: null,
          providers: ['n:credential'],
          createdAt: `fmt:${createdAt.toISOString()}`,
        },
      ],
      total: 2,
      page: 2,
      pageSize: 10,
    });
  });

  it('sets banDate from updatedAt when the user is banned', async () => {
    const bannedUser = makeUser({
      banned: true,
      banReason: 'spam',
    });

    listPagination.mockResolvedValue([bannedUser]);
    count.mockResolvedValue([]);
    findAccountsByUserIds.mockResolvedValue([]);
    findSessionsByUserIds.mockResolvedValue([]);

    const result = await listAdminUsers({ page: 1, pageSize: 20 });

    expect(result.total).toBe(0);
    expect(result.items).toEqual([
      {
        id: 'user-1',
        name: 'Alice',
        emailMasked: 'masked:alice@example.com',
        role: 'admin',
        banned: true,
        banReason: 'spam',
        banDate: updatedAt.toISOString(),
        lastLoginIp: null,
        providers: [],
        createdAt: `fmt:${createdAt.toISOString()}`,
      },
    ]);
  });
});
