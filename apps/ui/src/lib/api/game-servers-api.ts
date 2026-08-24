import { apiClient } from '@/lib/api-client';

export const gameServersAllQueryKey = ['game-servers-all'] as const;

export const listAllGameServers = async () => {
  const { data, error } = await apiClient.api.v1['game-server'].all.get();

  if (error) {
    throw new Error(error.value.message ?? '获取区服列表失败');
  }

  return data.data;
};

export type GameServerListItem = Awaited<
  ReturnType<typeof listAllGameServers>
>[number];
