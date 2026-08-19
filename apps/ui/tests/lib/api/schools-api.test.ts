import { beforeEach, describe, expect, it, vi } from 'vitest';

const { schoolAllGet } = vi.hoisted(() => ({
  schoolAllGet: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        school: {
          all: {
            get: schoolAllGet,
          },
        },
      },
    },
  },
}));

describe('schools-api', () => {
  beforeEach(() => {
    schoolAllGet.mockReset();
  });

  it('lists all schools and unwraps the envelope', async () => {
    const payload = [
      {
        id: '1',
        name: '纯阳',
        type: 'school',
        icon: '/icons/chunyang.png',
        alias: ['纯阳宫'],
      },
    ];
    schoolAllGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { listAllSchools } = await import('@/lib/api/schools-api');
    await expect(listAllSchools()).resolves.toEqual(payload);
    expect(schoolAllGet).toHaveBeenCalled();
  });

  it('throws the API message when listing fails', async () => {
    schoolAllGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { listAllSchools } = await import('@/lib/api/schools-api');
    await expect(listAllSchools()).rejects.toThrow('列表失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    schoolAllGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { listAllSchools } = await import('@/lib/api/schools-api');
    await expect(listAllSchools()).rejects.toThrow('获取门派列表失败');
  });
});
