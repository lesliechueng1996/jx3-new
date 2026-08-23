import { beforeEach, describe, expect, it, vi } from 'vitest';

const { gameDungeonSearchGet } = vi.hoisted(() => ({
  gameDungeonSearchGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'game-dungeon': {
          search: {
            get: gameDungeonSearchGet,
          },
        },
      },
    },
  },
}));

describe('game-dungeons-api', () => {
  beforeEach(() => {
    gameDungeonSearchGet.mockReset();
  });

  it('searches dungeons and unwraps the envelope', async () => {
    const payload = [{ id: '1', name: '25人英雄' }];
    gameDungeonSearchGet.mockResolvedValue({
      data: { data: payload },
      error: null,
    });

    const { searchGameDungeons } = await import('@/lib/api/game-dungeons-api');
    await expect(searchGameDungeons('英雄')).resolves.toEqual(payload);
    expect(gameDungeonSearchGet).toHaveBeenCalledWith({
      query: { name: '英雄' },
    });
  });

  it('builds a search query key', async () => {
    const { gameDungeonsSearchQueryKey } = await import(
      '@/lib/api/game-dungeons-api'
    );
    expect(gameDungeonsSearchQueryKey('英雄')).toEqual([
      'game-dungeons-search',
      '英雄',
    ]);
  });

  it('throws the API message when search fails', async () => {
    gameDungeonSearchGet.mockResolvedValue({
      data: null,
      error: { value: { message: '搜索失败' } },
    });
    const { searchGameDungeons } = await import('@/lib/api/game-dungeons-api');
    await expect(searchGameDungeons('英雄')).rejects.toThrow('搜索失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    gameDungeonSearchGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { searchGameDungeons } = await import('@/lib/api/game-dungeons-api');
    await expect(searchGameDungeons('英雄')).rejects.toThrow('搜索副本失败');
  });
});
