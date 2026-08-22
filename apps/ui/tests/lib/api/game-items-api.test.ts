import { beforeEach, describe, expect, it, vi } from 'vitest';

const { itemSearchGet } = vi.hoisted(() => ({
  itemSearchGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'game-item': {
          search: {
            get: itemSearchGet,
          },
        },
      },
    },
  },
}));

describe('game-items-api', () => {
  beforeEach(() => {
    itemSearchGet.mockReset();
  });

  it('searches items and unwraps the envelope', async () => {
    const payload = [
      {
        id: '1',
        name: '上品玄晶',
        type: 'special',
        quality: 'orange',
        icon: '/icons/xuanjing.png',
        alias: ['大铁'],
      },
    ];
    itemSearchGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { searchGameItems, gameItemsSearchQueryKey } = await import(
      '@/lib/api/game-items-api'
    );
    await expect(searchGameItems('玄晶')).resolves.toEqual(payload);
    expect(itemSearchGet).toHaveBeenCalledWith({
      query: { name: '玄晶' },
    });
    expect(gameItemsSearchQueryKey('玄晶')).toEqual([
      'game-items-search',
      '玄晶',
    ]);
  });

  it('throws the API message when search fails', async () => {
    itemSearchGet.mockResolvedValue({
      data: null,
      error: { value: { message: '搜索失败' } },
    });
    const { searchGameItems } = await import('@/lib/api/game-items-api');
    await expect(searchGameItems('玄晶')).rejects.toThrow('搜索失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    itemSearchGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { searchGameItems } = await import('@/lib/api/game-items-api');
    await expect(searchGameItems('玄晶')).rejects.toThrow('搜索物品失败');
  });
});
