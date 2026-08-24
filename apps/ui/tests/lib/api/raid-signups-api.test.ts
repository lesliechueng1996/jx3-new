import { beforeEach, describe, expect, it, vi } from 'vitest';

const { raidSignupSearchGet } = vi.hoisted(() => ({
  raidSignupSearchGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'raid-signup': {
          search: {
            get: raidSignupSearchGet,
          },
        },
      },
    },
  },
}));

describe('raid-signups-api', () => {
  beforeEach(() => {
    raidSignupSearchGet.mockReset();
  });

  it('searches signups and unwraps the envelope', async () => {
    const payload = [{ id: '1', characterName: '少侠甲' }];
    raidSignupSearchGet.mockResolvedValue({
      data: { data: payload },
      error: null,
    });

    const { searchRaidSignups } = await import('@/lib/api/raid-signups-api');
    await expect(searchRaidSignups('少侠')).resolves.toEqual(payload);
    expect(raidSignupSearchGet).toHaveBeenCalledWith({
      query: { name: '少侠' },
    });
  });

  it('builds a search query key', async () => {
    const { raidSignupsSearchQueryKey } = await import(
      '@/lib/api/raid-signups-api'
    );
    expect(raidSignupsSearchQueryKey('少侠')).toEqual([
      'raid-signups-search',
      '少侠',
    ]);
  });

  it('throws the API message when search fails', async () => {
    raidSignupSearchGet.mockResolvedValue({
      data: null,
      error: { value: { message: '搜索失败' } },
    });
    const { searchRaidSignups } = await import('@/lib/api/raid-signups-api');
    await expect(searchRaidSignups('少侠')).rejects.toThrow('搜索失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    raidSignupSearchGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { searchRaidSignups } = await import('@/lib/api/raid-signups-api');
    await expect(searchRaidSignups('少侠')).rejects.toThrow('搜索角色名失败');
  });
});
