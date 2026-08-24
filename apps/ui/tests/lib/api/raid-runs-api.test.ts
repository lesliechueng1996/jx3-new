import { beforeEach, describe, expect, it, vi } from 'vitest';

const { gameRaidIdPatch, wagesPatch } = vi.hoisted(() => ({
  gameRaidIdPatch: vi.fn(),
  wagesPatch: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'raid-run': (_params: { id: string }) => ({
          'game-raid-id': {
            patch: gameRaidIdPatch,
          },
          wages: {
            patch: wagesPatch,
          },
        }),
      },
    },
  },
}));

describe('raid-runs-api', () => {
  beforeEach(() => {
    gameRaidIdPatch.mockReset();
    wagesPatch.mockReset();
  });

  it('updates the game raid id and unwraps the envelope', async () => {
    gameRaidIdPatch.mockResolvedValue({
      data: { data: { gameRaidId: 'game-1' } },
      error: null,
    });

    const { updateRaidRunGameRaidId } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunGameRaidId('run-1', 'game-1')).resolves.toEqual({
      gameRaidId: 'game-1',
    });
    expect(gameRaidIdPatch).toHaveBeenCalledWith({ gameRaidId: 'game-1' });
  });

  it('throws the API message when updating the game raid id fails', async () => {
    gameRaidIdPatch.mockResolvedValue({
      data: null,
      error: { value: { message: '记录失败' } },
    });
    const { updateRaidRunGameRaidId } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunGameRaidId('run-1', 'game-1')).rejects.toThrow(
      '记录失败',
    );
  });

  it('uses a fallback message when the game raid id API omits one', async () => {
    gameRaidIdPatch.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { updateRaidRunGameRaidId } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunGameRaidId('run-1', 'game-1')).rejects.toThrow(
      '记录副本ID失败',
    );
  });

  it('updates wages and unwraps the envelope', async () => {
    const payload = {
      totalIncome: 15000,
      subsidyAmount: 2000,
      wagePerPerson: 1300,
    };
    wagesPatch.mockResolvedValue({
      data: { data: payload },
      error: null,
    });

    const { updateRaidRunWages } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunWages('run-1', payload)).resolves.toEqual(
      payload,
    );
    expect(wagesPatch).toHaveBeenCalledWith(payload);
  });

  it('throws the API message when updating wages fails', async () => {
    wagesPatch.mockResolvedValue({
      data: null,
      error: { value: { message: '工资失败' } },
    });
    const { updateRaidRunWages } = await import('@/lib/api/raid-runs-api');
    await expect(
      updateRaidRunWages('run-1', {
        totalIncome: 1,
        subsidyAmount: 0,
        wagePerPerson: 0,
      }),
    ).rejects.toThrow('工资失败');
  });

  it('uses a fallback message when the wages API omits one', async () => {
    wagesPatch.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { updateRaidRunWages } = await import('@/lib/api/raid-runs-api');
    await expect(
      updateRaidRunWages('run-1', {
        totalIncome: 1,
        subsidyAmount: 0,
        wagePerPerson: 0,
      }),
    ).rejects.toThrow('记录工资失败');
  });
});
