import { beforeEach, describe, expect, it, vi } from 'vitest';

const { raidSignupGet } = vi.hoisted(() => ({
  raidSignupGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'raid-signup': {
          get: raidSignupGet,
        },
      },
    },
  },
}));

describe('admin-raid-signups-api', () => {
  beforeEach(() => {
    raidSignupGet.mockReset();
  });

  it('lists raid signups and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', characterName: '少侠甲' }], total: 1 };
    raidSignupGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListRaidSignups } = await import(
      '@/lib/api/admin/admin-raid-signups-api'
    );
    await expect(
      adminListRaidSignups({
        page: 1,
        pageSize: 20,
        characterName: '少侠',
        raidRunName: '周六',
        serverId: 'server-1',
        kungfuId: 'kungfu-1',
        role: 'dps',
        flags: ['leader', 'darkRun'],
      }),
    ).resolves.toEqual(payload);
    expect(raidSignupGet).toHaveBeenCalledWith({
      query: {
        page: 1,
        pageSize: 20,
        characterName: '少侠',
        raidRunName: '周六',
        serverId: 'server-1',
        kungfuId: 'kungfu-1',
        role: 'dps',
        flags: ['leader', 'darkRun'],
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    raidSignupGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListRaidSignups } = await import(
      '@/lib/api/admin/admin-raid-signups-api'
    );
    await expect(
      adminListRaidSignups({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('列表失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    raidSignupGet.mockResolvedValue({ data: null, error: { value: {} } });
    const { adminListRaidSignups } = await import(
      '@/lib/api/admin/admin-raid-signups-api'
    );
    await expect(
      adminListRaidSignups({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取报名列表失败');
  });
});
