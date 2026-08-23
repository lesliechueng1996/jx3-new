import { apiClient } from '@/lib/api-client';

export const gameDungeonsSearchQueryKey = (name: string) =>
  ['game-dungeons-search', name] as const;

export const searchGameDungeons = async (name: string) => {
  const { data, error } = await apiClient.api.v1['game-dungeon'].search.get({
    query: { name },
  });

  if (error) {
    throw new Error(error.value.message ?? '搜索副本失败');
  }

  return data.data;
};

export type GameDungeonSearchItem = Awaited<
  ReturnType<typeof searchGameDungeons>
>[number];
