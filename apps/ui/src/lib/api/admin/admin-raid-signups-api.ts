import { apiClient } from '@/lib/api-client';

export type RaidSignupRole = 'pending' | 'tank' | 'healer' | 'dps' | 'boss';

export type RaidSignupStatus =
  | 'pending'
  | 'confirmed'
  | 'waitlist'
  | 'rejected';

export type RaidSignupFlag =
  | 'leader'
  | 'darkRun'
  | 'formationCore'
  | 'reserved';

export type ListRaidSignupsFilters = {
  page: number;
  pageSize: number;
  characterName?: string;
  raidRunName?: string;
  serverId?: string;
  kungfuId?: string;
  role?: RaidSignupRole;
  flags?: RaidSignupFlag[];
};

export const adminListRaidSignups = async (filters: ListRaidSignupsFilters) => {
  const { data, error } = await apiClient.api.v1['raid-signup'].get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      characterName: filters.characterName,
      raidRunName: filters.raidRunName,
      serverId: filters.serverId,
      kungfuId: filters.kungfuId,
      role: filters.role,
      flags: filters.flags,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取报名列表失败');
  }

  return data.data;
};

export type AdminRaidSignupListItem = Awaited<
  ReturnType<typeof adminListRaidSignups>
>['items'][number];
