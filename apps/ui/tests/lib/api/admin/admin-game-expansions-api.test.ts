import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  gameExpansionGet,
  gameExpansionPost,
  gameExpansionPatch,
  gameExpansionDelete,
} = vi.hoisted(() => ({
  gameExpansionGet: vi.fn(),
  gameExpansionPost: vi.fn(),
  gameExpansionPatch: vi.fn(),
  gameExpansionDelete: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'game-expansion': Object.assign(
          (params: { id: string }) => ({
            patch: (body: unknown) => gameExpansionPatch(params, body),
            delete: () => gameExpansionDelete(params),
          }),
          {
            get: gameExpansionGet,
            post: gameExpansionPost,
          },
        ),
      },
    },
  },
}));

describe('admin-game-expansions-api', () => {
  beforeEach(() => {
    gameExpansionGet.mockReset();
    gameExpansionPost.mockReset();
    gameExpansionPatch.mockReset();
    gameExpansionDelete.mockReset();
  });

  it('lists expansions and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: '江湖' }] };
    gameExpansionGet.mockResolvedValue({
      data: { data: payload },
      error: null,
    });

    const { adminListGameExpansions } = await import(
      '@/lib/api/admin/admin-game-expansions-api'
    );
    await expect(adminListGameExpansions()).resolves.toEqual(payload);
    expect(gameExpansionGet).toHaveBeenCalledWith();
  });

  it('throws the API message when listing fails', async () => {
    gameExpansionGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListGameExpansions } = await import(
      '@/lib/api/admin/admin-game-expansions-api'
    );
    await expect(adminListGameExpansions()).rejects.toThrow('列表失败');
  });

  it('uses fallback messages when the API omits one', async () => {
    gameExpansionGet.mockResolvedValue({ data: null, error: { value: {} } });
    gameExpansionPost.mockResolvedValue({ error: { value: {} } });
    gameExpansionPatch.mockResolvedValue({ error: { value: {} } });
    gameExpansionDelete.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-game-expansions-api');
    const body = {
      name: '江湖',
      level: 120,
      description: null,
      startDate: '2024-01-01',
      endDate: null,
    };

    await expect(api.adminListGameExpansions()).rejects.toThrow(
      '获取资料片列表失败',
    );
    await expect(api.adminCreateGameExpansion(body)).rejects.toThrow(
      '创建资料片失败',
    );
    await expect(api.adminUpdateGameExpansion('1', body)).rejects.toThrow(
      '更新资料片失败',
    );
    await expect(api.adminDeleteGameExpansion('1')).rejects.toThrow(
      '删除资料片失败',
    );
  });

  it('creates, updates, and deletes', async () => {
    const body = {
      name: '江湖',
      level: 120,
      description: '描述',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
    };
    gameExpansionPost.mockResolvedValue({
      data: { data: { id: 'n' } },
      error: null,
    });
    gameExpansionPatch.mockResolvedValue({
      data: { data: { id: '1' } },
      error: null,
    });
    gameExpansionDelete.mockResolvedValue({ error: null });

    const api = await import('@/lib/api/admin/admin-game-expansions-api');

    await expect(api.adminCreateGameExpansion(body)).resolves.toEqual({
      id: 'n',
    });
    await expect(api.adminUpdateGameExpansion('1', body)).resolves.toEqual({
      id: '1',
    });
    await api.adminDeleteGameExpansion('1');
  });
});
