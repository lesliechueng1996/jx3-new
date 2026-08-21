import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  gameServerGet,
  gameServerPost,
  gameServerPatch,
  gameServerDelete,
  gameServerSyncPost,
} = vi.hoisted(() => ({
  gameServerGet: vi.fn(),
  gameServerPost: vi.fn(),
  gameServerPatch: vi.fn(),
  gameServerDelete: vi.fn(),
  gameServerSyncPost: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'game-server': Object.assign(
          (params: { id: string }) => ({
            patch: (body: unknown) => gameServerPatch(params, body),
            delete: () => gameServerDelete(params),
          }),
          {
            get: gameServerGet,
            post: gameServerPost,
            sync: {
              post: gameServerSyncPost,
            },
          },
        ),
      },
    },
  },
}));

describe('admin-game-servers-api', () => {
  beforeEach(() => {
    gameServerGet.mockReset();
    gameServerPost.mockReset();
    gameServerPatch.mockReset();
    gameServerDelete.mockReset();
    gameServerSyncPost.mockReset();
  });

  it('lists game servers and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: '梦江南' }] };
    gameServerGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListGameServers } = await import(
      '@/lib/api/admin/admin-game-servers-api'
    );
    await expect(adminListGameServers()).resolves.toEqual(payload);
    expect(gameServerGet).toHaveBeenCalledWith();
  });

  it('throws the API message when listing fails', async () => {
    gameServerGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListGameServers } = await import(
      '@/lib/api/admin/admin-game-servers-api'
    );
    await expect(adminListGameServers()).rejects.toThrow('列表失败');
  });

  it('throws the API message when syncing fails', async () => {
    gameServerSyncPost.mockResolvedValue({
      data: null,
      error: { value: { message: '上游失败' } },
    });
    const { adminSyncGameServers } = await import(
      '@/lib/api/admin/admin-game-servers-api'
    );
    await expect(adminSyncGameServers()).rejects.toThrow('上游失败');
  });

  it('uses fallback messages when the API omits one', async () => {
    gameServerGet.mockResolvedValue({ data: null, error: { value: {} } });
    gameServerPost.mockResolvedValue({ error: { value: {} } });
    gameServerPatch.mockResolvedValue({ error: { value: {} } });
    gameServerDelete.mockResolvedValue({ error: { value: {} } });
    gameServerSyncPost.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-game-servers-api');

    await expect(api.adminListGameServers()).rejects.toThrow(
      '获取区服列表失败',
    );
    await expect(
      api.adminCreateGameServer({
        serverId: 'mengjiangnan',
        zone: '电信一区',
        name: '梦江南',
        alias: [],
      }),
    ).rejects.toThrow('创建区服失败');
    await expect(
      api.adminUpdateGameServer('1', {
        serverId: 'mengjiangnan',
        zone: '电信一区',
        name: '梦江南',
        alias: ['梦岛'],
      }),
    ).rejects.toThrow('更新区服失败');
    await expect(api.adminDeleteGameServer('1')).rejects.toThrow(
      '删除区服失败',
    );
    await expect(api.adminSyncGameServers()).rejects.toThrow('同步区服失败');
  });

  it('creates, updates, and deletes', async () => {
    gameServerPost.mockResolvedValue({
      data: { data: { id: 'n' } },
      error: null,
    });
    gameServerPatch.mockResolvedValue({
      data: { data: { id: '1' } },
      error: null,
    });
    gameServerDelete.mockResolvedValue({ error: null });
    gameServerSyncPost.mockResolvedValue({
      data: { data: { updatedCount: 1, insertedCount: 2 } },
      error: null,
    });

    const api = await import('@/lib/api/admin/admin-game-servers-api');

    await expect(
      api.adminCreateGameServer({
        serverId: 'mengjiangnan',
        zone: '电信一区',
        name: '梦江南',
        alias: ['梦岛'],
      }),
    ).resolves.toEqual({ id: 'n' });
    await expect(
      api.adminUpdateGameServer('1', {
        serverId: 'aodai',
        zone: '双线一区',
        name: '绝代',
        alias: [],
      }),
    ).resolves.toEqual({ id: '1' });
    await api.adminDeleteGameServer('1');
    await expect(api.adminSyncGameServers()).resolves.toEqual({
      updatedCount: 1,
      insertedCount: 2,
    });
    expect(gameServerSyncPost).toHaveBeenCalled();
  });
});
