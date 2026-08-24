import { apiClient } from '@/lib/api-client';

export const raidRunLootsQueryKey = (raidRunId: string) =>
  ['raid-run-loots', raidRunId] as const;

export type RaidLootUpsertBody = {
  itemId: string;
  quantity: number;
  winnerSignupId?: string | null;
  price?: number | null;
  remark?: string | null;
};

export const listRaidRunLoots = async (raidRunId: string) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  }).loot.get();

  if (error) {
    throw new Error(error.value.message ?? '获取掉落失败');
  }

  return data.data;
};

export type RaidLootItem = Awaited<ReturnType<typeof listRaidRunLoots>>[number];

export const createRaidRunLoot = async (
  raidRunId: string,
  body: RaidLootUpsertBody,
) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  }).loot.post(body);

  if (error) {
    throw new Error(error.value.message ?? '添加掉落失败');
  }

  return data.data;
};

export const updateRaidRunLoot = async (
  raidRunId: string,
  lootId: string,
  body: RaidLootUpsertBody,
) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  })
    .loot({ lootId })
    .patch(body);

  if (error) {
    throw new Error(error.value.message ?? '更新掉落失败');
  }

  return data.data;
};

export const deleteRaidRunLoot = async (raidRunId: string, lootId: string) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  })
    .loot({ lootId })
    .delete();

  if (error) {
    throw new Error(error.value.message ?? '删除掉落失败');
  }

  return data.data;
};
