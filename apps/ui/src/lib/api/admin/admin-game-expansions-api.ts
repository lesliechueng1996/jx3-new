import { apiClient } from '@/lib/api-client';

export const adminListGameExpansions = async () => {
  const { data, error } = await apiClient.api.v1['game-expansion'].get();

  if (error) {
    throw new Error(error.value.message ?? '获取资料片列表失败');
  }

  return data.data;
};

export type AdminGameExpansionListItem = Awaited<
  ReturnType<typeof adminListGameExpansions>
>['items'][number];

export type AdminGameExpansionFormValues = {
  name: string;
  level: number;
  description: string | null;
  startDate: string;
  endDate: string | null;
};

export const adminCreateGameExpansion = async (
  expansion: AdminGameExpansionFormValues,
) => {
  const { data, error } = await apiClient.api.v1['game-expansion'].post({
    name: expansion.name,
    level: expansion.level,
    description: expansion.description,
    startDate: expansion.startDate,
    endDate: expansion.endDate,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建资料片失败');
  }

  return data.data;
};

export const adminUpdateGameExpansion = async (
  expansionId: string,
  expansion: AdminGameExpansionFormValues,
) => {
  const { data, error } = await apiClient.api.v1['game-expansion']({
    id: expansionId,
  }).patch({
    name: expansion.name,
    level: expansion.level,
    description: expansion.description,
    startDate: expansion.startDate,
    endDate: expansion.endDate,
  });

  if (error) {
    throw new Error(error.value.message ?? '更新资料片失败');
  }

  return data.data;
};

export const adminDeleteGameExpansion = async (expansionId: string) => {
  const { error } = await apiClient.api.v1['game-expansion']({
    id: expansionId,
  }).delete();

  if (error) {
    throw new Error(error.value.message ?? '删除资料片失败');
  }
};
