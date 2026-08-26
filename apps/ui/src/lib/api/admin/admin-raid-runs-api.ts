import { apiClient } from '@/lib/api-client';

export type RaidRunStatus =
  | 'pending'
  | 'recruiting'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type ListRaidRunsFilters = {
  page: number;
  pageSize: number;
  name?: string;
  status?: RaidRunStatus;
  dungeonId?: string;
  startDate?: string;
};

export const adminListRaidRuns = async (filters: ListRaidRunsFilters) => {
  const { data, error } = await apiClient.api.v1['raid-run'].get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      name: filters.name,
      status: filters.status,
      dungeonId: filters.dungeonId,
      startDate: filters.startDate,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取开团列表失败');
  }

  return data.data;
};

export type AdminRaidRunListItem = Awaited<
  ReturnType<typeof adminListRaidRuns>
>['items'][number];

export const adminCopyRaidRun = async (raidRunId: string) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  }).copy.post();

  if (error) {
    throw new Error(error.value.message ?? '复制开团失败');
  }

  return data.data;
};

export const adminDeleteRaidRun = async (raidRunId: string) => {
  const { error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  }).delete();

  if (error) {
    throw new Error(error.value.message ?? '删除开团失败');
  }
};
