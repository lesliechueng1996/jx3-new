import { apiClient } from '@/lib/api-client';

export const adminListGameServers = async () => {
  const { data, error } = await apiClient.api.v1['game-server'].get();

  if (error) {
    throw new Error(error.value.message ?? '获取区服列表失败');
  }

  return data.data;
};

export type AdminGameServerListItem = Awaited<
  ReturnType<typeof adminListGameServers>
>['items'][number];

export type AdminGameServerFormValues = {
  serverId: string;
  zone: string;
  name: string;
  alias: string[];
};

export const adminCreateGameServer = async (
  gameServer: AdminGameServerFormValues,
) => {
  const { data, error } = await apiClient.api.v1['game-server'].post({
    serverId: gameServer.serverId,
    zone: gameServer.zone,
    name: gameServer.name,
    alias: gameServer.alias,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建区服失败');
  }

  return data.data;
};

export const adminUpdateGameServer = async (
  gameServerId: string,
  gameServer: AdminGameServerFormValues,
) => {
  const { data, error } = await apiClient.api.v1['game-server']({
    id: gameServerId,
  }).patch({
    serverId: gameServer.serverId,
    zone: gameServer.zone,
    name: gameServer.name,
    alias: gameServer.alias,
  });

  if (error) {
    throw new Error(error.value.message ?? '更新区服失败');
  }

  return data.data;
};

export const adminDeleteGameServer = async (gameServerId: string) => {
  const { error } = await apiClient.api.v1['game-server']({
    id: gameServerId,
  }).delete();

  if (error) {
    throw new Error(error.value.message ?? '删除区服失败');
  }
};

export const adminSyncGameServers = async () => {
  const { data, error } = await apiClient.api.v1['game-server'].sync.post();

  if (error) {
    throw new Error(error.value.message ?? '同步区服失败');
  }

  return data.data;
};
