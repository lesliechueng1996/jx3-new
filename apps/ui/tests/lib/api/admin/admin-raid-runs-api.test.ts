import { beforeEach, describe, expect, it, vi } from 'vitest';

const { raidRunGet, raidRunDelete, raidRunCopy } = vi.hoisted(() => ({
  raidRunGet: vi.fn(),
  raidRunDelete: vi.fn(),
  raidRunCopy: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'raid-run': Object.assign(
          (params: { id: string }) => ({
            delete: () => raidRunDelete(params),
            copy: {
              post: () => raidRunCopy(params),
            },
          }),
          {
            get: raidRunGet,
          },
        ),
      },
    },
  },
}));

describe('admin-raid-runs-api', () => {
  beforeEach(() => {
    raidRunGet.mockReset();
    raidRunDelete.mockReset();
    raidRunCopy.mockReset();
  });

  it('lists raid runs and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: '周六团' }], total: 1 };
    raidRunGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListRaidRuns } = await import(
      '@/lib/api/admin/admin-raid-runs-api'
    );
    await expect(
      adminListRaidRuns({
        page: 1,
        pageSize: 20,
        name: '周六',
        status: 'pending',
      }),
    ).resolves.toEqual(payload);
    expect(raidRunGet).toHaveBeenCalledWith({
      query: {
        page: 1,
        pageSize: 20,
        name: '周六',
        status: 'pending',
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    raidRunGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListRaidRuns } = await import(
      '@/lib/api/admin/admin-raid-runs-api'
    );
    await expect(adminListRaidRuns({ page: 1, pageSize: 20 })).rejects.toThrow(
      '列表失败',
    );
  });

  it('throws the API message when copying fails', async () => {
    raidRunCopy.mockResolvedValue({
      data: null,
      error: { value: { message: '无权复制' } },
    });
    const api = await import('@/lib/api/admin/admin-raid-runs-api');
    await expect(api.adminCopyRaidRun('1')).rejects.toThrow('无权复制');
  });

  it('uses fallback messages when the API omits one', async () => {
    raidRunGet.mockResolvedValue({ data: null, error: { value: {} } });
    raidRunDelete.mockResolvedValue({ error: { value: {} } });
    raidRunCopy.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-raid-runs-api');

    await expect(
      api.adminListRaidRuns({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取开团列表失败');
    await expect(api.adminDeleteRaidRun('1')).rejects.toThrow('删除开团失败');
    await expect(api.adminCopyRaidRun('1')).rejects.toThrow('复制开团失败');
  });

  it('copies a raid run and unwraps the envelope', async () => {
    raidRunCopy.mockResolvedValue({
      data: { data: { id: 'copied-1' } },
      error: null,
    });

    const api = await import('@/lib/api/admin/admin-raid-runs-api');
    await expect(api.adminCopyRaidRun('1')).resolves.toEqual({
      id: 'copied-1',
    });
    expect(raidRunCopy).toHaveBeenCalledWith({ id: '1' });
  });

  it('deletes a raid run', async () => {
    raidRunDelete.mockResolvedValue({ error: null });

    const api = await import('@/lib/api/admin/admin-raid-runs-api');
    await api.adminDeleteRaidRun('1');
    expect(raidRunDelete).toHaveBeenCalledWith({ id: '1' });
  });
});
