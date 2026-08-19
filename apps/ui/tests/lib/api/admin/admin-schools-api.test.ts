import { beforeEach, describe, expect, it, vi } from 'vitest';

const { schoolGet, schoolPost, schoolPatch, schoolDelete } = vi.hoisted(() => ({
  schoolGet: vi.fn(),
  schoolPost: vi.fn(),
  schoolPatch: vi.fn(),
  schoolDelete: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        school: Object.assign(
          (params: { id: string }) => ({
            patch: (body: unknown) => schoolPatch(params, body),
            delete: () => schoolDelete(params),
          }),
          {
            get: schoolGet,
            post: schoolPost,
          },
        ),
      },
    },
  },
}));

describe('admin-schools-api', () => {
  beforeEach(() => {
    schoolGet.mockReset();
    schoolPost.mockReset();
    schoolPatch.mockReset();
    schoolDelete.mockReset();
  });

  it('lists schools and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: '纯阳' }], total: 1 };
    schoolGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListSchools } = await import(
      '@/lib/api/admin/admin-schools-api'
    );
    await expect(
      adminListSchools({
        page: 1,
        pageSize: 20,
        name: '纯',
        type: 'school',
      }),
    ).resolves.toEqual(payload);
    expect(schoolGet).toHaveBeenCalledWith({
      query: {
        page: 1,
        pageSize: 20,
        name: '纯',
        type: 'school',
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    schoolGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListSchools } = await import(
      '@/lib/api/admin/admin-schools-api'
    );
    await expect(adminListSchools({ page: 1, pageSize: 20 })).rejects.toThrow(
      '列表失败',
    );
  });

  it('uses fallback messages when the API omits one', async () => {
    schoolGet.mockResolvedValue({ data: null, error: { value: {} } });
    schoolPost.mockResolvedValue({ error: { value: {} } });
    schoolPatch.mockResolvedValue({ error: { value: {} } });
    schoolDelete.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-schools-api');

    await expect(
      api.adminListSchools({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取门派列表失败');
    await expect(
      api.adminCreateSchool({
        name: '纯阳',
        type: 'school',
        icon: null,
        alias: [],
      }),
    ).rejects.toThrow('创建门派失败');
    await expect(
      api.adminUpdateSchool('1', {
        name: '纯阳',
        type: 'genre',
        icon: 'icon.png',
        alias: ['纯阳宫'],
      }),
    ).rejects.toThrow('更新门派失败');
    await expect(api.adminDeleteSchool('1')).rejects.toThrow('删除门派失败');
  });

  it('creates, updates, and deletes', async () => {
    schoolPost.mockResolvedValue({ data: { data: { id: 'n' } }, error: null });
    schoolPatch.mockResolvedValue({ data: { data: { id: '1' } }, error: null });
    schoolDelete.mockResolvedValue({ error: null });

    const api = await import('@/lib/api/admin/admin-schools-api');

    await expect(
      api.adminCreateSchool({
        name: '纯阳',
        type: 'school',
        icon: '/icon.png',
        alias: ['纯阳宫'],
      }),
    ).resolves.toEqual({ id: 'n' });
    await expect(
      api.adminUpdateSchool('1', {
        name: '纯阳宫',
        type: 'genre',
        icon: null,
        alias: [],
      }),
    ).resolves.toEqual({ id: '1' });
    await api.adminDeleteSchool('1');
  });
});
