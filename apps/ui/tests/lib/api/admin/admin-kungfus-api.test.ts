import { beforeEach, describe, expect, it, vi } from 'vitest';

const { kungfuGet, kungfuPost, kungfuPatch, kungfuDelete } = vi.hoisted(() => ({
  kungfuGet: vi.fn(),
  kungfuPost: vi.fn(),
  kungfuPatch: vi.fn(),
  kungfuDelete: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        kungfu: Object.assign(
          (params: { id: string }) => ({
            patch: (body: unknown) => kungfuPatch(params, body),
            delete: () => kungfuDelete(params),
          }),
          {
            get: kungfuGet,
            post: kungfuPost,
          },
        ),
      },
    },
  },
}));

const formValues = {
  name: '紫霞功',
  schoolId: 'school-1',
  kungfuType: 'attack' as const,
  attackType: 'internal' as const,
  attackMethod: 'ranged' as const,
  formationName: '紫霞',
  formationEffect: '提高内功攻击',
  isPveExternalRecommended: false,
  isPveInternalRecommended: true,
  isUnlimited: false,
  icon: '/icon.png',
  alias: ['气纯'],
};

describe('admin-kungfus-api', () => {
  beforeEach(() => {
    kungfuGet.mockReset();
    kungfuPost.mockReset();
    kungfuPatch.mockReset();
    kungfuDelete.mockReset();
  });

  it('lists kungfus and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: '紫霞功' }], total: 1 };
    kungfuGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListKungfus } = await import(
      '@/lib/api/admin/admin-kungfus-api'
    );
    await expect(
      adminListKungfus({
        page: 1,
        pageSize: 20,
        name: '紫',
        schoolId: 'school-1',
        kungfuType: 'attack',
        isUnlimited: false,
      }),
    ).resolves.toEqual(payload);
    expect(kungfuGet).toHaveBeenCalledWith({
      query: {
        page: 1,
        pageSize: 20,
        name: '紫',
        schoolId: 'school-1',
        kungfuType: 'attack',
        isUnlimited: false,
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    kungfuGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListKungfus } = await import(
      '@/lib/api/admin/admin-kungfus-api'
    );
    await expect(adminListKungfus({ page: 1, pageSize: 20 })).rejects.toThrow(
      '列表失败',
    );
  });

  it('uses fallback messages when the API omits one', async () => {
    kungfuGet.mockResolvedValue({ data: null, error: { value: {} } });
    kungfuPost.mockResolvedValue({ error: { value: {} } });
    kungfuPatch.mockResolvedValue({ error: { value: {} } });
    kungfuDelete.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-kungfus-api');

    await expect(
      api.adminListKungfus({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取心法列表失败');
    await expect(api.adminCreateKungfu(formValues)).rejects.toThrow(
      '创建心法失败',
    );
    await expect(api.adminUpdateKungfu('1', formValues)).rejects.toThrow(
      '更新心法失败',
    );
    await expect(api.adminDeleteKungfu('1')).rejects.toThrow('删除心法失败');
  });

  it('creates, updates, and deletes', async () => {
    kungfuPost.mockResolvedValue({ data: { data: { id: 'n' } }, error: null });
    kungfuPatch.mockResolvedValue({ data: { data: { id: '1' } }, error: null });
    kungfuDelete.mockResolvedValue({ error: null });

    const api = await import('@/lib/api/admin/admin-kungfus-api');

    await expect(api.adminCreateKungfu(formValues)).resolves.toEqual({
      id: 'n',
    });
    await expect(
      api.adminUpdateKungfu('1', {
        ...formValues,
        name: '紫霞',
        attackType: null,
        icon: null,
        alias: [],
      }),
    ).resolves.toEqual({ id: '1' });
    await api.adminDeleteKungfu('1');
  });
});
