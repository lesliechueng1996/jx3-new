import { apiClient } from '@/lib/api-client';

export const raidSignupsSearchQueryKey = (name: string) =>
  ['raid-signups-search', name] as const;

export const searchRaidSignups = async (name: string) => {
  const { data, error } = await apiClient.api.v1['raid-signup'].search.get({
    query: { name },
  });

  if (error) {
    throw new Error(error.value.message ?? '搜索角色名失败');
  }

  return data.data;
};

export type RaidSignupSearchItem = Awaited<
  ReturnType<typeof searchRaidSignups>
>[number];
