import { beforeEach, describe, expect, it, vi } from 'vitest';

const { gameServerAllGet } = vi.hoisted(() => ({
  gameServerAllGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'game-server': {
          all: {
            get: gameServerAllGet,
          },
        },
      },
    },
  },
}));

describe('game-servers-api', () => {
  beforeEach(() => {
    gameServerAllGet.mockReset();
  });

  it('lists all game servers and unwraps the envelope', async () => {
    const payload = [
      {
        id: '1',
        zone: '电信一区',
        name: '梦江南',
        alias: ['梦岛'],
      },
    ];
    gameServerAllGet.mockResolvedValue({
      data: { data: payload },
      error: null,
    });

    const { listAllGameServers } = await import('@/lib/api/game-servers-api');
    await expect(listAllGameServers()).resolves.toEqual(payload);
    expect(gameServerAllGet).toHaveBeenCalled();
  });

  it('throws the API message when listing fails', async () => {
    gameServerAllGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { listAllGameServers } = await import('@/lib/api/game-servers-api');
    await expect(listAllGameServers()).rejects.toThrow('列表失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    gameServerAllGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { listAllGameServers } = await import('@/lib/api/game-servers-api');
    await expect(listAllGameServers()).rejects.toThrow('获取区服列表失败');
  });
});
