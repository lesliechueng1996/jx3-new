import { beforeEach, describe, expect, it, vi } from 'vitest';

const { gameSeasonGet, gameSeasonPost, gameSeasonPatch, gameSeasonDelete } =
  vi.hoisted(() => ({
    gameSeasonGet: vi.fn(),
    gameSeasonPost: vi.fn(),
    gameSeasonPatch: vi.fn(),
    gameSeasonDelete: vi.fn(),
  }));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'game-season': Object.assign(
          (params: { id: string }) => ({
            patch: (body: unknown) => gameSeasonPatch(params, body),
            delete: () => gameSeasonDelete(params),
          }),
          {
            get: gameSeasonGet,
            post: gameSeasonPost,
          },
        ),
      },
    },
  },
}));

describe('admin-game-seasons-api', () => {
  beforeEach(() => {
    gameSeasonGet.mockReset();
    gameSeasonPost.mockReset();
    gameSeasonPatch.mockReset();
    gameSeasonDelete.mockReset();
  });

  it('lists seasons and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: 'S1' }] };
    gameSeasonGet.mockResolvedValue({
      data: { data: payload },
      error: null,
    });

    const { adminListGameSeasons } = await import(
      '@/lib/api/admin/admin-game-seasons-api'
    );
    await expect(adminListGameSeasons('exp-1')).resolves.toEqual(payload);
    expect(gameSeasonGet).toHaveBeenCalledWith({
      query: { expansionId: 'exp-1' },
    });
  });

  it('throws the API message when listing fails', async () => {
    gameSeasonGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListGameSeasons } = await import(
      '@/lib/api/admin/admin-game-seasons-api'
    );
    await expect(adminListGameSeasons('exp-1')).rejects.toThrow('列表失败');
  });

  it('uses fallback messages when the API omits one', async () => {
    gameSeasonGet.mockResolvedValue({ data: null, error: { value: {} } });
    gameSeasonPost.mockResolvedValue({ error: { value: {} } });
    gameSeasonPatch.mockResolvedValue({ error: { value: {} } });
    gameSeasonDelete.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-game-seasons-api');
    const body = {
      expansionId: 'exp-1',
      name: 'S1',
      description: null,
      startDate: '2024-06-01',
      endDate: null,
      sortOrder: 0,
    };

    await expect(api.adminListGameSeasons('exp-1')).rejects.toThrow(
      '获取赛季列表失败',
    );
    await expect(api.adminCreateGameSeason(body)).rejects.toThrow(
      '创建赛季失败',
    );
    await expect(
      api.adminUpdateGameSeason('1', {
        name: 'S1',
        description: null,
        startDate: '2024-06-01',
        endDate: null,
        sortOrder: 0,
      }),
    ).rejects.toThrow('更新赛季失败');
    await expect(api.adminDeleteGameSeason('1')).rejects.toThrow(
      '删除赛季失败',
    );
  });

  it('creates, updates, and deletes', async () => {
    const body = {
      expansionId: 'exp-1',
      name: 'S1',
      description: '描述',
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      sortOrder: 1,
    };
    gameSeasonPost.mockResolvedValue({
      data: { data: { id: 'n' } },
      error: null,
    });
    gameSeasonPatch.mockResolvedValue({
      data: { data: { id: '1' } },
      error: null,
    });
    gameSeasonDelete.mockResolvedValue({ error: null });

    const api = await import('@/lib/api/admin/admin-game-seasons-api');

    await expect(api.adminCreateGameSeason(body)).resolves.toEqual({ id: 'n' });
    await expect(
      api.adminUpdateGameSeason('1', {
        name: 'S2',
        description: null,
        startDate: '2024-06-01',
        endDate: null,
        sortOrder: 2,
      }),
    ).resolves.toEqual({ id: '1' });
    await api.adminDeleteGameSeason('1');
  });
});
