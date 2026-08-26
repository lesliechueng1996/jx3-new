import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dungeonGet, dungeonGetById, dungeonPost, dungeonPatch, dungeonDelete } =
  vi.hoisted(() => ({
    dungeonGet: vi.fn(),
    dungeonGetById: vi.fn(),
    dungeonPost: vi.fn(),
    dungeonPatch: vi.fn(),
    dungeonDelete: vi.fn(),
  }));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'game-dungeon': Object.assign(
          (params: { id: string }) => ({
            get: () => dungeonGetById(params),
            patch: (body: unknown) => dungeonPatch(params, body),
            delete: () => dungeonDelete(params),
          }),
          {
            get: dungeonGet,
            post: dungeonPost,
          },
        ),
      },
    },
  },
}));

const formValues = {
  name: '河阳之战',
  expansionId: 'expansion-1',
  seasonId: 'season-1',
  playerLimit: 25,
  difficulty: 'heroic' as const,
  levelRequirement: 120,
  bossCount: 6,
  resetWeekdays: [1, 4],
};

describe('admin-game-dungeons-api', () => {
  beforeEach(() => {
    dungeonGet.mockReset();
    dungeonGetById.mockReset();
    dungeonPost.mockReset();
    dungeonPatch.mockReset();
    dungeonDelete.mockReset();
  });

  it('lists dungeons and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: '河阳之战' }], total: 1 };
    dungeonGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListGameDungeons } = await import(
      '@/lib/api/admin/admin-game-dungeons-api'
    );
    await expect(
      adminListGameDungeons({
        page: 1,
        pageSize: 20,
        name: '河',
        expansionId: 'expansion-1',
        seasonId: 'season-1',
        difficulty: 'heroic',
      }),
    ).resolves.toEqual(payload);
    expect(dungeonGet).toHaveBeenCalledWith({
      query: {
        page: 1,
        pageSize: 20,
        name: '河',
        expansionId: 'expansion-1',
        seasonId: 'season-1',
        difficulty: 'heroic',
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    dungeonGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListGameDungeons } = await import(
      '@/lib/api/admin/admin-game-dungeons-api'
    );
    await expect(
      adminListGameDungeons({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('列表失败');
  });

  it('uses fallback messages when the API omits one', async () => {
    dungeonGet.mockResolvedValue({ data: null, error: { value: {} } });
    dungeonGetById.mockResolvedValue({ data: null, error: { value: {} } });
    dungeonPost.mockResolvedValue({ error: { value: {} } });
    dungeonPatch.mockResolvedValue({ error: { value: {} } });
    dungeonDelete.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-game-dungeons-api');

    await expect(
      api.adminListGameDungeons({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取副本列表失败');
    await expect(api.adminGetGameDungeon('1')).rejects.toThrow('获取副本失败');
    await expect(api.adminCreateGameDungeon(formValues)).rejects.toThrow(
      '创建副本失败',
    );
    await expect(api.adminUpdateGameDungeon('1', formValues)).rejects.toThrow(
      '更新副本失败',
    );
    await expect(api.adminDeleteGameDungeon('1')).rejects.toThrow(
      '删除副本失败',
    );
  });

  it('creates, updates, and deletes', async () => {
    dungeonPost.mockResolvedValue({
      data: { data: { id: 'n' } },
      error: null,
    });
    dungeonPatch.mockResolvedValue({
      data: { data: { id: '1' } },
      error: null,
    });
    dungeonDelete.mockResolvedValue({ error: null });

    const api = await import('@/lib/api/admin/admin-game-dungeons-api');

    await expect(api.adminCreateGameDungeon(formValues)).resolves.toEqual({
      id: 'n',
    });
    await expect(
      api.adminUpdateGameDungeon('1', {
        ...formValues,
        name: '河阳',
        resetWeekdays: [],
      }),
    ).resolves.toEqual({ id: '1' });
    await api.adminDeleteGameDungeon('1');
  });

  it('gets a dungeon by id and unwraps the envelope', async () => {
    const payload = { id: '1', name: '河阳之战' };
    dungeonGetById.mockResolvedValue({ data: { data: payload }, error: null });

    const api = await import('@/lib/api/admin/admin-game-dungeons-api');
    await expect(api.adminGetGameDungeon('1')).resolves.toEqual(payload);
    expect(dungeonGetById).toHaveBeenCalledWith({ id: '1' });
    expect(api.adminGameDungeonQueryKey('1')).toEqual([
      'admin-game-dungeon',
      '1',
    ]);
  });
});
