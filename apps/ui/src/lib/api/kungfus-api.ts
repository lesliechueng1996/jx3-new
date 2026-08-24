import { apiClient } from '@/lib/api-client';

export const kungfusAllQueryKey = ['kungfus-all'] as const;

export const listAllKungfus = async () => {
  const { data, error } = await apiClient.api.v1.kungfu.all.get();

  if (error) {
    throw new Error(error.value.message ?? '获取心法列表失败');
  }

  return data.data;
};

export type KungfuListItem = Awaited<ReturnType<typeof listAllKungfus>>[number];
