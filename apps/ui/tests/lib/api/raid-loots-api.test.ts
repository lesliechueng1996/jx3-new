import { beforeEach, describe, expect, it, vi } from 'vitest';

const { lootGet, lootPost, lootPatch, lootDelete } = vi.hoisted(() => ({
  lootGet: vi.fn(),
  lootPost: vi.fn(),
  lootPatch: vi.fn(),
  lootDelete: vi.fn(),
}));

const raidRun = Object.assign(
  (_params: { id: string }) => ({
    loot: Object.assign(
      (_lootParams: { lootId: string }) => ({
        patch: lootPatch,
        delete: lootDelete,
      }),
      {
        get: lootGet,
        post: lootPost,
      },
    ),
  }),
  {},
);

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'raid-run': raidRun,
      },
    },
  },
}));

const loot = {
  id: 'loot-1',
  raidRunId: 'run-1',
  itemId: 'item-1',
  itemName: '上品玄晶',
  itemIcon: null,
  itemType: 'special',
  itemQuality: 'orange',
  quantity: 1,
  winnerSignupId: null,
  winnerCharacterName: null,
  winnerServerName: null,
  price: null,
  remark: null,
  createdAt: '2026-08-24T07:00:00.000Z',
};

const body = {
  itemId: 'item-1',
  quantity: 1,
  winnerSignupId: null,
  price: 1000,
  remark: '首刀',
};

describe('raid-loots-api', () => {
  beforeEach(() => {
    lootGet.mockReset();
    lootPost.mockReset();
    lootPatch.mockReset();
    lootDelete.mockReset();
  });

  it('lists loot and unwraps the envelope', async () => {
    lootGet.mockResolvedValue({ data: { data: [loot] }, error: null });
    const { listRaidRunLoots, raidRunLootsQueryKey } = await import(
      '@/lib/api/raid-loots-api'
    );
    await expect(listRaidRunLoots('run-1')).resolves.toEqual([loot]);
    expect(raidRunLootsQueryKey('run-1')).toEqual(['raid-run-loots', 'run-1']);
  });

  it('throws when list fails', async () => {
    lootGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { listRaidRunLoots } = await import('@/lib/api/raid-loots-api');
    await expect(listRaidRunLoots('run-1')).rejects.toThrow('列表失败');
  });

  it('uses a fallback list message', async () => {
    lootGet.mockResolvedValue({ data: null, error: { value: {} } });
    const { listRaidRunLoots } = await import('@/lib/api/raid-loots-api');
    await expect(listRaidRunLoots('run-1')).rejects.toThrow('获取掉落失败');
  });

  it('creates loot', async () => {
    lootPost.mockResolvedValue({ data: { data: loot }, error: null });
    const { createRaidRunLoot } = await import('@/lib/api/raid-loots-api');
    await expect(createRaidRunLoot('run-1', body)).resolves.toEqual(loot);
    expect(lootPost).toHaveBeenCalledWith(body);
  });

  it('throws when create fails', async () => {
    lootPost.mockResolvedValue({
      data: null,
      error: { value: { message: '添加失败' } },
    });
    const { createRaidRunLoot } = await import('@/lib/api/raid-loots-api');
    await expect(createRaidRunLoot('run-1', body)).rejects.toThrow('添加失败');
  });

  it('uses a fallback create message', async () => {
    lootPost.mockResolvedValue({ data: null, error: { value: {} } });
    const { createRaidRunLoot } = await import('@/lib/api/raid-loots-api');
    await expect(createRaidRunLoot('run-1', body)).rejects.toThrow(
      '添加掉落失败',
    );
  });

  it('updates loot', async () => {
    lootPatch.mockResolvedValue({ data: { data: loot }, error: null });
    const { updateRaidRunLoot } = await import('@/lib/api/raid-loots-api');
    await expect(updateRaidRunLoot('run-1', 'loot-1', body)).resolves.toEqual(
      loot,
    );
    expect(lootPatch).toHaveBeenCalledWith(body);
  });

  it('throws when update fails', async () => {
    lootPatch.mockResolvedValue({
      data: null,
      error: { value: { message: '更新失败' } },
    });
    const { updateRaidRunLoot } = await import('@/lib/api/raid-loots-api');
    await expect(updateRaidRunLoot('run-1', 'loot-1', body)).rejects.toThrow(
      '更新失败',
    );
  });

  it('uses a fallback update message', async () => {
    lootPatch.mockResolvedValue({ data: null, error: { value: {} } });
    const { updateRaidRunLoot } = await import('@/lib/api/raid-loots-api');
    await expect(updateRaidRunLoot('run-1', 'loot-1', body)).rejects.toThrow(
      '更新掉落失败',
    );
  });

  it('deletes loot', async () => {
    lootDelete.mockResolvedValue({ data: { data: null }, error: null });
    const { deleteRaidRunLoot } = await import('@/lib/api/raid-loots-api');
    await expect(deleteRaidRunLoot('run-1', 'loot-1')).resolves.toBeNull();
  });

  it('throws when delete fails', async () => {
    lootDelete.mockResolvedValue({
      data: null,
      error: { value: { message: '删除失败' } },
    });
    const { deleteRaidRunLoot } = await import('@/lib/api/raid-loots-api');
    await expect(deleteRaidRunLoot('run-1', 'loot-1')).rejects.toThrow(
      '删除失败',
    );
  });

  it('uses a fallback delete message', async () => {
    lootDelete.mockResolvedValue({ data: null, error: { value: {} } });
    const { deleteRaidRunLoot } = await import('@/lib/api/raid-loots-api');
    await expect(deleteRaidRunLoot('run-1', 'loot-1')).rejects.toThrow(
      '删除掉落失败',
    );
  });
});
