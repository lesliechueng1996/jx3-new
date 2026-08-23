import { beforeEach, describe, expect, it, vi } from 'vitest';

const { kungfuAllGet } = vi.hoisted(() => ({
  kungfuAllGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        kungfu: {
          all: {
            get: kungfuAllGet,
          },
        },
      },
    },
  },
}));

describe('kungfus-api', () => {
  beforeEach(() => {
    kungfuAllGet.mockReset();
  });

  it('lists all kungfus and unwraps the envelope', async () => {
    const payload = [
      {
        id: '1',
        name: '紫霞功',
        schoolId: 'school-1',
        schoolName: '纯阳',
        kungfuType: 'attack',
        icon: '/icons/zixia.png',
        alias: ['气纯'],
      },
    ];
    kungfuAllGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { listAllKungfus } = await import('@/lib/api/kungfus-api');
    await expect(listAllKungfus()).resolves.toEqual(payload);
    expect(kungfuAllGet).toHaveBeenCalled();
  });

  it('throws the API message when listing fails', async () => {
    kungfuAllGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { listAllKungfus } = await import('@/lib/api/kungfus-api');
    await expect(listAllKungfus()).rejects.toThrow('列表失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    kungfuAllGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { listAllKungfus } = await import('@/lib/api/kungfus-api');
    await expect(listAllKungfus()).rejects.toThrow('获取心法列表失败');
  });
});
