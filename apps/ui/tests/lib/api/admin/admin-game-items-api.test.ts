import { beforeEach, describe, expect, it, vi } from 'vitest';

const { itemGet, itemPost, itemPatch, itemDelete } = vi.hoisted(() => ({
  itemGet: vi.fn(),
  itemPost: vi.fn(),
  itemPatch: vi.fn(),
  itemDelete: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'game-item': Object.assign(
          (params: { id: string }) => ({
            patch: (body: unknown) => itemPatch(params, body),
            delete: () => itemDelete(params),
          }),
          {
            get: itemGet,
            post: itemPost,
          },
        ),
      },
    },
  },
}));

const formValues = {
  name: '上品玄晶',
  gameItemId: '12345',
  type: 'special' as const,
  quality: 'orange' as const,
  description: '用于装备精炼',
  icon: '/icon.png',
  alias: ['大铁'],
};

describe('admin-game-items-api', () => {
  beforeEach(() => {
    itemGet.mockReset();
    itemPost.mockReset();
    itemPatch.mockReset();
    itemDelete.mockReset();
  });

  it('lists items and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: '上品玄晶' }], total: 1 };
    itemGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListGameItems } = await import(
      '@/lib/api/admin/admin-game-items-api'
    );
    await expect(
      adminListGameItems({
        page: 1,
        pageSize: 20,
        name: '玄',
        type: 'special',
        quality: 'orange',
        missingIcon: true,
      }),
    ).resolves.toEqual(payload);
    expect(itemGet).toHaveBeenCalledWith({
      query: {
        page: 1,
        pageSize: 20,
        name: '玄',
        type: 'special',
        quality: 'orange',
        missingIcon: true,
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    itemGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListGameItems } = await import(
      '@/lib/api/admin/admin-game-items-api'
    );
    await expect(adminListGameItems({ page: 1, pageSize: 20 })).rejects.toThrow(
      '列表失败',
    );
  });

  it('uses fallback messages when the API omits one', async () => {
    itemGet.mockResolvedValue({ data: null, error: { value: {} } });
    itemPost.mockResolvedValue({ error: { value: {} } });
    itemPatch.mockResolvedValue({ error: { value: {} } });
    itemDelete.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-game-items-api');

    await expect(
      api.adminListGameItems({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取物品列表失败');
    await expect(api.adminCreateGameItem(formValues)).rejects.toThrow(
      '创建物品失败',
    );
    await expect(api.adminUpdateGameItem('1', formValues)).rejects.toThrow(
      '更新物品失败',
    );
    await expect(api.adminDeleteGameItem('1')).rejects.toThrow('删除物品失败');
  });

  it('creates, updates, and deletes', async () => {
    itemPost.mockResolvedValue({ data: { data: { id: 'n' } }, error: null });
    itemPatch.mockResolvedValue({ data: { data: { id: '1' } }, error: null });
    itemDelete.mockResolvedValue({ error: null });

    const api = await import('@/lib/api/admin/admin-game-items-api');

    await expect(api.adminCreateGameItem(formValues)).resolves.toEqual({
      id: 'n',
    });
    await expect(
      api.adminUpdateGameItem('1', {
        ...formValues,
        gameItemId: null,
        description: null,
        icon: null,
        alias: [],
      }),
    ).resolves.toEqual({ id: '1' });
    await api.adminDeleteGameItem('1');
  });
});
