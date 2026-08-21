import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ListUsersQuery } from '@api/interface/schema/user-schema';
import {
  ConflictException,
  ERROR_CODES,
  ForbiddenException,
  NotFoundException,
} from '@api/shared/exception';

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
const findById = mock<(id: string) => Promise<UserRow | null>>(() =>
  Promise.resolve(null),
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
const logger = {
  error: mock((message: string) => message),
  warn: mock((message: string) => message),
  info: mock((message: string) => message),
};
const createUser = mock(async () => ({ user: { id: 'user-1' } }));
const adminUpdateUserApi = mock(async () => ({ id: 'user-1' }));
const setRole = mock(async () => ({ user: { id: 'user-1' } }));
const setUserPassword = mock(async () => ({ status: true }));
const changePasswordApi = mock(async () => ({ status: true }));
const updateUserApi = mock(async () => ({
  headers: new Headers(),
  response: { status: true },
}));
const banUser = mock(async () => ({ user: { id: 'user-1' } }));
const unbanUser = mock(async () => ({ user: { id: 'user-1' } }));
const removeUser = mock(async () => ({ success: true }));
const updateImage = mock(async () => undefined);
const storageUpload = mock(
  async () => 'http://avatars.example/user-1/uuid-1.png',
);
const storageDeletePublicUrl = mock(async () => undefined);
const getBunS3StorageService = mock(() => ({
  upload: storageUpload,
  deletePublicUrl: storageDeletePublicUrl,
}));
const generateUUID = mock(() => 'uuid-1');

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/infrastructure/repository/user-repository', () => ({
  userRepository: {
    buildWhereClause,
    listPagination,
    count,
    findById,
    updateImage,
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
  roleAdmin: 'admin',
  roleUser: 'user',
  auth: {
    api: {
      createUser,
      adminUpdateUser: adminUpdateUserApi,
      setRole,
      setUserPassword,
      changePassword: changePasswordApi,
      updateUser: updateUserApi,
      banUser,
      unbanUser,
      removeUser,
    },
  },
}));

mock.module(
  '@api/infrastructure/external/storage/bun-s3-storage-service',
  () => ({
    getBunS3StorageService,
  }),
);

mock.module('@api/shared/util/uuid', () => ({
  generateUUID,
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

mock.module('@api/shared/util/email', () => ({
  maskEmail,
}));

const {
  banAdminUser,
  changeCurrentUserPassword,
  createAdminUser,
  deleteAdminUser,
  getAdminUser,
  listAdminUsers,
  unbanAdminUser,
  updateAdminUser,
  uploadCurrentUserAvatar,
} = await import('@api/application/service/user-service');

const createdAt = new Date('2026-01-15T08:00:00.000Z');
const updatedAt = new Date('2026-02-01T12:00:00.000Z');
const banExpires = new Date('2026-03-01T00:00:00.000Z');
const whereClause = { kind: 'where' };
const headers = new Headers();
const actorId = 'actor-1';

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
  role: 'user',
  banned: false,
  banReason: null,
  banExpires: null,
  createdAt,
  updatedAt,
  ...overrides,
});

const expectedDetail = {
  id: 'user-1',
  name: 'Alice',
  emailMasked: 'masked:alice@example.com',
  role: 'user',
  banned: false,
  banReason: null,
  banExpires: null,
  lastLoginIp: null,
  providers: [],
  createdAt: `fmt:${createdAt.toISOString()}`,
  updatedAt: `fmt:${updatedAt.toISOString()}`,
};

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
    const alice = makeUser({ role: 'admin' });
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
      role: 'admin',
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

describe('admin user mutations', () => {
  beforeEach(() => {
    findById.mockReset();
    findAccountsByUserIds.mockReset();
    findSessionsByUserIds.mockReset();
    normalizeProviders.mockReset();
    formatDateTime.mockReset();
    maskEmail.mockReset();
    logger.error.mockReset();
    logger.warn.mockReset();
    logger.info.mockReset();
    createUser.mockReset();
    adminUpdateUserApi.mockReset();
    setRole.mockReset();
    setUserPassword.mockReset();
    banUser.mockReset();
    unbanUser.mockReset();
    removeUser.mockReset();

    findById.mockResolvedValue(makeUser());
    findAccountsByUserIds.mockResolvedValue([]);
    findSessionsByUserIds.mockResolvedValue([]);
    normalizeProviders.mockImplementation((ids: string[]) => ids);
    formatDateTime.mockImplementation(
      (date: Date) => `fmt:${date.toISOString()}`,
    );
    maskEmail.mockImplementation((email: string) => `masked:${email}`);
    createUser.mockResolvedValue({ user: { id: 'user-1' } });
    adminUpdateUserApi.mockResolvedValue({ id: 'user-1' });
    setRole.mockResolvedValue({ user: { id: 'user-1' } });
    setUserPassword.mockResolvedValue({ status: true });
    banUser.mockResolvedValue({ user: { id: 'user-1' } });
    unbanUser.mockResolvedValue({ user: { id: 'user-1' } });
    removeUser.mockResolvedValue({ success: true });
  });

  it('returns user detail with optional fields and latest login ip', async () => {
    findById.mockResolvedValue(
      makeUser({
        role: null,
        banned: null,
        banReason: null,
        banExpires,
      }),
    );
    findAccountsByUserIds.mockResolvedValue([
      { userId: 'user-1', providerId: 'credential' },
    ]);
    findSessionsByUserIds.mockResolvedValue([
      { userId: 'user-1', ipAddress: '9.9.9.9', createdAt },
      { userId: 'user-1', ipAddress: '1.1.1.1', createdAt },
    ]);

    const result = await getAdminUser('user-1');

    expect(result).toEqual({
      ...expectedDetail,
      role: null,
      banned: false,
      banExpires: banExpires.toISOString(),
      lastLoginIp: '9.9.9.9',
      providers: ['credential'],
    });
  });

  it('uses null lastLoginIp when the latest session has no address', async () => {
    findSessionsByUserIds.mockResolvedValue([
      { userId: 'user-1', ipAddress: undefined, createdAt },
    ]);

    const result = await getAdminUser('user-1');

    expect(result.lastLoginIp).toBeNull();
  });

  it('throws when the user does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(getAdminUser('missing')).rejects.toEqual(
      new NotFoundException('用户不存在', ERROR_CODES.USER_NOT_FOUND),
    );
  });

  it('creates a user with the default role', async () => {
    const result = await createAdminUser(
      {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password1',
      },
      headers,
    );

    expect(createUser).toHaveBeenCalledWith({
      body: {
        email: 'alice@example.com',
        password: 'password1',
        name: 'Alice',
        role: 'user',
      },
      headers,
    });
    expect(result).toEqual(expectedDetail);
  });

  it('creates a user with an explicit role', async () => {
    await createAdminUser(
      {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password1',
        role: 'admin',
      },
      headers,
    );

    expect(createUser).toHaveBeenCalledWith({
      body: {
        email: 'alice@example.com',
        password: 'password1',
        name: 'Alice',
        role: 'admin',
      },
      headers,
    });
  });

  it('maps email conflicts from Better Auth body.code', async () => {
    createUser.mockRejectedValue({
      body: { code: 'USER_ALREADY_EXISTS' },
    });

    await expect(
      createAdminUser(
        {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'password1',
        },
        headers,
      ),
    ).rejects.toEqual(
      new ConflictException(
        '邮箱已被使用',
        ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
      ),
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('maps email conflicts from Better Auth error.code', async () => {
    createUser.mockRejectedValue({
      code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
    });

    await expect(
      createAdminUser(
        {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'password1',
        },
        headers,
      ),
    ).rejects.toEqual(
      new ConflictException(
        '邮箱已被使用',
        ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
      ),
    );
  });

  it('rethrows unknown Better Auth errors', async () => {
    const error = { body: { code: 'FAILED_TO_CREATE_USER' } };
    createUser.mockRejectedValue(error);

    await expect(
      createAdminUser(
        {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'password1',
        },
        headers,
      ),
    ).rejects.toBe(error);
  });

  it('rethrows non-object Better Auth errors', async () => {
    createUser.mockRejectedValue('boom');

    await expect(
      createAdminUser(
        {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'password1',
        },
        headers,
      ),
    ).rejects.toBe('boom');
  });

  it('rethrows object errors without a code', async () => {
    const error = { message: 'failed' };
    createUser.mockRejectedValue(error);

    await expect(
      createAdminUser(
        {
          name: 'Alice',
          email: 'alice@example.com',
          password: 'password1',
        },
        headers,
      ),
    ).rejects.toBe(error);
  });

  it('updates name, email, role, and password', async () => {
    const result = await updateAdminUser(
      'user-1',
      {
        name: 'Alicia',
        email: 'alicia@example.com',
        role: 'admin',
        password: 'password2',
      },
      actorId,
      headers,
    );

    expect(adminUpdateUserApi).toHaveBeenCalledWith({
      body: {
        userId: 'user-1',
        data: { name: 'Alicia', email: 'alicia@example.com' },
      },
      headers,
    });
    expect(setRole).toHaveBeenCalledWith({
      body: { userId: 'user-1', role: 'admin' },
      headers,
    });
    expect(setUserPassword).toHaveBeenCalledWith({
      body: { userId: 'user-1', newPassword: 'password2' },
      headers,
    });
    expect(result.id).toBe('user-1');
  });

  it('skips profile and role updates when only password changes', async () => {
    await updateAdminUser(
      'user-1',
      { password: 'password2' },
      actorId,
      headers,
    );

    expect(adminUpdateUserApi).not.toHaveBeenCalled();
    expect(setRole).not.toHaveBeenCalled();
    expect(setUserPassword).toHaveBeenCalled();
  });

  it('updates email without changing name', async () => {
    await updateAdminUser(
      'user-1',
      { email: 'new@example.com' },
      actorId,
      headers,
    );

    expect(adminUpdateUserApi).toHaveBeenCalledWith({
      body: {
        userId: 'user-1',
        data: { email: 'new@example.com' },
      },
      headers,
    });
  });

  it('forbids changing the actor role', async () => {
    findById.mockResolvedValue(makeUser({ id: actorId, role: 'admin' }));

    await expect(
      updateAdminUser(actorId, { role: 'user' }, actorId, headers),
    ).rejects.toEqual(
      new ForbiddenException(
        '不能修改自己的角色',
        ERROR_CODES.USER_CANNOT_OPERATE_SELF,
      ),
    );
    expect(adminUpdateUserApi).not.toHaveBeenCalled();
  });

  it('deletes a regular user', async () => {
    await deleteAdminUser('user-1', actorId, headers);

    expect(removeUser).toHaveBeenCalledWith({
      body: { userId: 'user-1' },
      headers,
    });
  });

  it('forbids deleting yourself', async () => {
    findById.mockResolvedValue(makeUser({ id: actorId, role: 'admin' }));

    await expect(deleteAdminUser(actorId, actorId, headers)).rejects.toEqual(
      new ForbiddenException(
        '不能对自己执行该操作',
        ERROR_CODES.USER_CANNOT_OPERATE_SELF,
      ),
    );
    expect(removeUser).not.toHaveBeenCalled();
  });

  it('forbids deleting another admin', async () => {
    findById.mockResolvedValue(makeUser({ role: 'admin' }));

    await expect(deleteAdminUser('user-1', actorId, headers)).rejects.toEqual(
      new ForbiddenException(
        '不能封禁或删除其他管理员',
        ERROR_CODES.USER_CANNOT_MODIFY_ADMIN,
      ),
    );
  });

  it('bans a user permanently', async () => {
    const result = await banAdminUser(
      'user-1',
      { reason: 'spam' },
      actorId,
      headers,
    );

    expect(banUser).toHaveBeenCalledWith({
      body: { userId: 'user-1', banReason: 'spam' },
      headers,
    });
    expect(result).toEqual(expectedDetail);
  });

  it('bans a user with an expiry', async () => {
    await banAdminUser(
      'user-1',
      { reason: 'spam', banExpiresIn: 3600 },
      actorId,
      headers,
    );

    expect(banUser).toHaveBeenCalledWith({
      body: { userId: 'user-1', banReason: 'spam', banExpiresIn: 3600 },
      headers,
    });
  });

  it('forbids banning another admin', async () => {
    findById.mockResolvedValue(makeUser({ role: 'admin' }));

    await expect(
      banAdminUser('user-1', { reason: 'spam' }, actorId, headers),
    ).rejects.toEqual(
      new ForbiddenException(
        '不能封禁或删除其他管理员',
        ERROR_CODES.USER_CANNOT_MODIFY_ADMIN,
      ),
    );
    expect(banUser).not.toHaveBeenCalled();
  });

  it('unbans a user', async () => {
    const result = await unbanAdminUser('user-1', headers);

    expect(unbanUser).toHaveBeenCalledWith({
      body: { userId: 'user-1' },
      headers,
    });
    expect(result).toEqual(expectedDetail);
  });
});

describe('uploadCurrentUserAvatar', () => {
  beforeEach(() => {
    findById.mockReset();
    updateImage.mockReset();
    storageUpload.mockReset();
    storageDeletePublicUrl.mockReset();
    generateUUID.mockReset();
    logger.error.mockReset();
    logger.warn.mockReset();
    logger.info.mockReset();
    getBunS3StorageService.mockReset();
    updateUserApi.mockReset();

    findById.mockResolvedValue(makeUser());
    updateImage.mockResolvedValue(undefined);
    storageUpload.mockResolvedValue('http://avatars.example/user-1/uuid-1.png');
    storageDeletePublicUrl.mockResolvedValue(undefined);
    generateUUID.mockReturnValue('uuid-1');
    const sessionHeaders = new Headers();
    sessionHeaders.append('set-cookie', 'better-auth.session_data=token');
    updateUserApi.mockResolvedValue({
      headers: sessionHeaders,
      response: { status: true },
    });
    getBunS3StorageService.mockReturnValue({
      upload: storageUpload,
      deletePublicUrl: storageDeletePublicUrl,
    });
  });

  it('uploads a png avatar and updates the user image', async () => {
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });

    const result = await uploadCurrentUserAvatar('user-1', file, headers);

    expect(storageUpload).toHaveBeenCalledWith({
      key: 'user-1/uuid-1.png',
      body: file,
      contentType: 'image/png',
    });
    expect(updateImage).toHaveBeenCalledWith(
      'user-1',
      'http://avatars.example/user-1/uuid-1.png',
    );
    expect(updateUserApi).toHaveBeenCalledWith({
      body: { image: 'http://avatars.example/user-1/uuid-1.png' },
      headers,
      returnHeaders: true,
    });
    expect(storageDeletePublicUrl).not.toHaveBeenCalled();
    expect(result).toEqual({
      imageUrl: 'http://avatars.example/user-1/uuid-1.png',
      sessionCookies: ['better-auth.session_data=token'],
    });
  });

  it('maps jpeg, jpg, and webp content types', async () => {
    await uploadCurrentUserAvatar(
      'user-1',
      new File(['jpg'], 'a.jpg', { type: 'image/jpeg' }),
      headers,
    );
    expect(storageUpload).toHaveBeenLastCalledWith(
      expect.objectContaining({
        key: 'user-1/uuid-1.jpg',
        contentType: 'image/jpeg',
      }),
    );

    await uploadCurrentUserAvatar(
      'user-1',
      new File(['jpg'], 'a.jpg', { type: 'image/jpg' }),
      headers,
    );
    expect(storageUpload).toHaveBeenLastCalledWith(
      expect.objectContaining({
        key: 'user-1/uuid-1.jpg',
        contentType: 'image/jpeg',
      }),
    );

    await uploadCurrentUserAvatar(
      'user-1',
      new File(['webp'], 'a.webp', { type: 'image/webp' }),
      headers,
    );
    expect(storageUpload).toHaveBeenLastCalledWith(
      expect.objectContaining({
        key: 'user-1/uuid-1.webp',
        contentType: 'image/webp',
      }),
    );
  });

  it('falls back to the filename extension when type is missing', async () => {
    await uploadCurrentUserAvatar(
      'user-1',
      new File(['jpg'], 'photo.jpeg', { type: '' }),
      headers,
    );
    expect(storageUpload).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'user-1/uuid-1.jpg' }),
    );

    await uploadCurrentUserAvatar(
      'user-1',
      new File(['jpg'], 'photo.jpg', { type: '' }),
      headers,
    );
    expect(storageUpload).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'user-1/uuid-1.jpg' }),
    );

    await uploadCurrentUserAvatar(
      'user-1',
      new File(['png'], 'photo.png', { type: '' }),
      headers,
    );
    expect(storageUpload).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'user-1/uuid-1.png' }),
    );

    await uploadCurrentUserAvatar(
      'user-1',
      new File(['webp'], 'photo.webp', { type: '' }),
      headers,
    );
    expect(storageUpload).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'user-1/uuid-1.webp' }),
    );
  });

  it('rejects unsupported avatar types', async () => {
    await expect(
      uploadCurrentUserAvatar(
        'user-1',
        new File(['gif'], 'a.gif', { type: 'image/gif' }),
        headers,
      ),
    ).rejects.toMatchObject({
      message: '头像须为 JPEG、PNG 或 WebP',
      code: ERROR_CODES.USER_AVATAR_INVALID,
    });
    expect(storageUpload).not.toHaveBeenCalled();
  });

  it('rejects a file with no type and no usable extension', async () => {
    await expect(
      uploadCurrentUserAvatar(
        'user-1',
        new File(['bin'], 'avatar', { type: '' }),
        headers,
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.USER_AVATAR_INVALID,
    });
  });

  it('deletes the previous avatar after a successful upload', async () => {
    findById.mockResolvedValue(
      makeUser({ image: 'http://avatars.example/old.png' }),
    );

    await uploadCurrentUserAvatar(
      'user-1',
      new File(['png'], 'avatar.png', { type: 'image/png' }),
      headers,
    );

    expect(storageDeletePublicUrl).toHaveBeenCalledWith(
      'http://avatars.example/old.png',
    );
  });

  it('warns when deleting the previous avatar fails', async () => {
    findById.mockResolvedValue(
      makeUser({ image: 'http://avatars.example/old.png' }),
    );
    storageDeletePublicUrl.mockRejectedValue(new Error('s3 down'));

    await uploadCurrentUserAvatar(
      'user-1',
      new File(['png'], 'avatar.png', { type: 'image/png' }),
      headers,
    );

    expect(logger.warn).toHaveBeenCalled();
  });

  it('keeps the previous avatar when the session cookie cannot be refreshed', async () => {
    findById.mockResolvedValue(
      makeUser({ image: 'http://avatars.example/old.png' }),
    );
    updateUserApi.mockRejectedValue(new Error('origin'));

    await expect(
      uploadCurrentUserAvatar(
        'user-1',
        new File(['png'], 'avatar.png', { type: 'image/png' }),
        headers,
      ),
    ).rejects.toMatchObject({
      message: '头像已保存，但登录态未更新',
      code: ERROR_CODES.USER_SESSION_REFRESH_FAILED,
    });
    expect(updateImage).toHaveBeenCalled();
    expect(storageDeletePublicUrl).not.toHaveBeenCalled();
  });

  it('maps storage failures to an internal error', async () => {
    storageUpload.mockRejectedValue(new Error('s3 down'));

    await expect(
      uploadCurrentUserAvatar(
        'user-1',
        new File(['png'], 'avatar.png', { type: 'image/png' }),
        headers,
      ),
    ).rejects.toMatchObject({
      message: '头像上传失败',
      code: ERROR_CODES.STORAGE_UPLOAD_FAILED,
    });
    expect(logger.error).toHaveBeenCalled();
    expect(updateImage).not.toHaveBeenCalled();
  });
});

describe('changeCurrentUserPassword', () => {
  beforeEach(() => {
    changePasswordApi.mockReset();
    logger.error.mockReset();
    logger.info.mockReset();
    changePasswordApi.mockResolvedValue({ status: true });
  });

  it('changes the password and revokes other sessions', async () => {
    await changeCurrentUserPassword(
      'user-1',
      { currentPassword: 'old-pass1', newPassword: 'new-pass1' },
      headers,
    );

    expect(changePasswordApi).toHaveBeenCalledWith({
      body: {
        currentPassword: 'old-pass1',
        newPassword: 'new-pass1',
        revokeOtherSessions: true,
      },
      headers,
    });
  });

  it('maps an invalid current password', async () => {
    changePasswordApi.mockRejectedValue({
      body: { code: 'INVALID_PASSWORD' },
    });

    await expect(
      changeCurrentUserPassword(
        'user-1',
        { currentPassword: 'wrong', newPassword: 'new-pass1' },
        headers,
      ),
    ).rejects.toMatchObject({
      message: '当前密码错误',
      code: ERROR_CODES.USER_INVALID_PASSWORD,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('maps a missing credential account', async () => {
    changePasswordApi.mockRejectedValue({
      code: 'CREDENTIAL_ACCOUNT_NOT_FOUND',
    });

    await expect(
      changeCurrentUserPassword(
        'user-1',
        { currentPassword: 'old-pass1', newPassword: 'new-pass1' },
        headers,
      ),
    ).rejects.toMatchObject({
      message: '当前账号未设置密码',
      code: ERROR_CODES.USER_INVALID_PASSWORD,
    });
  });

  it('rethrows unknown Better Auth errors after logging', async () => {
    const error = { body: { code: 'FAILED' } };
    changePasswordApi.mockRejectedValue(error);

    await expect(
      changeCurrentUserPassword(
        'user-1',
        { currentPassword: 'old-pass1', newPassword: 'new-pass1' },
        headers,
      ),
    ).rejects.toBe(error);
    expect(logger.error).toHaveBeenCalled();
  });
});
