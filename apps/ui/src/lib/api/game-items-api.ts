import { apiClient } from '@/lib/api-client';

export const gameItemsSearchQueryKey = (name: string) =>
  ['game-items-search', name] as const;

export const searchGameItems = async (name: string) => {
  const { data, error } = await apiClient.api.v1['game-item'].search.get({
    query: { name },
  });

  if (error) {
    throw new Error(error.value.message ?? '搜索物品失败');
  }

  return data.data;
};

export type GameItemSearchItem = Awaited<
  ReturnType<typeof searchGameItems>
>[number];

export const createGameItemQuick = async (item: {
  name: string;
  type: GameItemSearchItem['type'];
  quality: GameItemSearchItem['quality'];
}) => {
  const { data, error } = await apiClient.api.v1['game-item'].quick.post(item);

  if (error) {
    throw new Error(error.value.message ?? '创建物品失败');
  }

  return data.data;
};
