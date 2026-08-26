import { apiClient } from '@/lib/api-client';

export type DungeonDifficulty = 'normal' | 'heroic' | 'challenge';

export type ListGameDungeonsFilters = {
  page: number;
  pageSize: number;
  name?: string;
  expansionId?: string;
  seasonId?: string;
  difficulty?: DungeonDifficulty;
};

export const adminListGameDungeons = async (
  filters: ListGameDungeonsFilters,
) => {
  const { data, error } = await apiClient.api.v1['game-dungeon'].get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      name: filters.name,
      expansionId: filters.expansionId,
      seasonId: filters.seasonId,
      difficulty: filters.difficulty,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取副本列表失败');
  }

  return data.data;
};

export type AdminGameDungeonListItem = Awaited<
  ReturnType<typeof adminListGameDungeons>
>['items'][number];

export const adminGameDungeonQueryKey = (id: string) =>
  ['admin-game-dungeon', id] as const;

export const adminGetGameDungeon = async (dungeonId: string) => {
  const { data, error } = await apiClient.api.v1['game-dungeon']({
    id: dungeonId,
  }).get();

  if (error) {
    throw new Error(error.value.message ?? '获取副本失败');
  }

  return data.data;
};

export type AdminGameDungeonFormValues = {
  name: string;
  expansionId: string;
  seasonId: string;
  playerLimit: number;
  difficulty: DungeonDifficulty;
  levelRequirement: number;
  bossCount: number;
  resetWeekdays: number[];
};

export const adminCreateGameDungeon = async (
  dungeon: AdminGameDungeonFormValues,
) => {
  const { data, error } = await apiClient.api.v1['game-dungeon'].post({
    name: dungeon.name,
    expansionId: dungeon.expansionId,
    seasonId: dungeon.seasonId,
    playerLimit: dungeon.playerLimit,
    difficulty: dungeon.difficulty,
    levelRequirement: dungeon.levelRequirement,
    bossCount: dungeon.bossCount,
    resetWeekdays: dungeon.resetWeekdays,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建副本失败');
  }

  return data.data;
};

export const adminUpdateGameDungeon = async (
  dungeonId: string,
  dungeon: AdminGameDungeonFormValues,
) => {
  const { data, error } = await apiClient.api.v1['game-dungeon']({
    id: dungeonId,
  }).patch({
    name: dungeon.name,
    expansionId: dungeon.expansionId,
    seasonId: dungeon.seasonId,
    playerLimit: dungeon.playerLimit,
    difficulty: dungeon.difficulty,
    levelRequirement: dungeon.levelRequirement,
    bossCount: dungeon.bossCount,
    resetWeekdays: dungeon.resetWeekdays,
  });

  if (error) {
    throw new Error(error.value.message ?? '更新副本失败');
  }

  return data.data;
};

export const adminDeleteGameDungeon = async (dungeonId: string) => {
  const { error } = await apiClient.api.v1['game-dungeon']({
    id: dungeonId,
  }).delete();

  if (error) {
    throw new Error(error.value.message ?? '删除副本失败');
  }
};
