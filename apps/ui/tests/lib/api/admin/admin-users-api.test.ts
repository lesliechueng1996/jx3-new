import { beforeEach, describe, expect, it, vi } from 'vitest';

const { userGet, userPost, userPatch, userDelete, userBan, userUnban } =
  vi.hoisted(() => ({
    userGet: vi.fn(),
    userPost: vi.fn(),
    userPatch: vi.fn(),
    userDelete: vi.fn(),
    userBan: vi.fn(),
    userUnban: vi.fn(),
  }));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        user: Object.assign(
          (params: { id: string }) => ({
            get: () => userGet(params),
            patch: (body: unknown) => userPatch(params, body),
            delete: () => userDelete(params),
            ban: { post: (body: unknown) => userBan(params, body) },
            unban: { post: () => userUnban(params) },
          }),
          {
            get: userGet,
            post: userPost,
          },
        ),
      },
    },
  },
}));

describe('admin-users-api', () => {
  beforeEach(() => {
    userGet.mockReset();
    userPost.mockReset();
    userPatch.mockReset();
    userDelete.mockReset();
    userBan.mockReset();
    userUnban.mockReset();
  });

  it('lists users and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: 'Alice' }], total: 1 };
    userGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListUsers } = await import('@/lib/api/admin/admin-users-api');
    await expect(
      adminListUsers({
        page: 1,
        pageSize: 20,
        name: 'Ali',
        email: 'a@',
        role: 'user',
        banned: false,
      }),
    ).resolves.toEqual(payload);
    expect(userGet).toHaveBeenCalledWith({
      query: {
        page: 1,
        pageSize: 20,
        name: 'Ali',
        email: 'a@',
        role: 'user',
        banned: false,
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    userGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListUsers } = await import('@/lib/api/admin/admin-users-api');
    await expect(adminListUsers({ page: 1, pageSize: 20 })).rejects.toThrow(
      '列表失败',
    );
  });

  it('uses fallback messages when the API omits one', async () => {
    userGet.mockResolvedValue({ data: null, error: { value: {} } });
    userPost.mockResolvedValue({ error: { value: {} } });
    userPatch.mockResolvedValue({ error: { value: {} } });
    userDelete.mockResolvedValue({ error: { value: {} } });
    userBan.mockResolvedValue({ error: { value: {} } });
    userUnban.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-users-api');

    await expect(api.adminListUsers({ page: 1, pageSize: 20 })).rejects.toThrow(
      '获取用户列表失败',
    );
    await expect(
      api.adminCreateUser({
        name: 'Alice',
        email: 'a@example.com',
        password: 'password1',
        role: 'user',
      }),
    ).rejects.toThrow('创建用户失败');
    await expect(
      api.adminUpdateUser('1', { name: 'A', role: 'user' }),
    ).rejects.toThrow('更新用户失败');
    await expect(api.adminDeleteUser('1')).rejects.toThrow('删除用户失败');
    await expect(api.adminBanUser('1', { reason: 'spam' })).rejects.toThrow(
      '封禁用户失败',
    );
    await expect(api.adminUnbanUser('1')).rejects.toThrow('解封用户失败');
  });

  it('creates, updates, deletes, bans, and unbans', async () => {
    userPost.mockResolvedValue({ data: { data: { id: 'n' } }, error: null });
    userPatch.mockResolvedValue({ data: { data: { id: '1' } }, error: null });
    userDelete.mockResolvedValue({ error: null });
    userBan.mockResolvedValue({ data: { data: { id: '1' } }, error: null });
    userUnban.mockResolvedValue({ data: { data: { id: '1' } }, error: null });

    const api = await import('@/lib/api/admin/admin-users-api');

    await expect(
      api.adminCreateUser({
        name: 'Alice',
        email: 'a@example.com',
        password: 'password1',
        role: 'admin',
      }),
    ).resolves.toEqual({ id: 'n' });
    await expect(
      api.adminUpdateUser('1', {
        name: 'Alicia',
        email: 'b@example.com',
        password: 'password2',
        role: 'user',
      }),
    ).resolves.toEqual({ id: '1' });
    await api.adminDeleteUser('1');
    await expect(
      api.adminBanUser('1', { reason: 'spam', banExpiresIn: 60 }),
    ).resolves.toEqual({ id: '1' });
    await expect(api.adminUnbanUser('1')).resolves.toEqual({ id: '1' });
  });
});
