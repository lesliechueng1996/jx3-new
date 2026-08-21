import { apiClient } from '@/lib/api-client';

export const adminListGameSeasons = async (expansionId: string) => {
  const { data, error } = await apiClient.api.v1['game-season'].get({
    query: { expansionId },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取赛季列表失败');
  }

  return data.data;
};

export type AdminGameSeasonListItem = Awaited<
  ReturnType<typeof adminListGameSeasons>
>['items'][number];

export type AdminGameSeasonFormValues = {
  expansionId: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  sortOrder: number;
};

export const adminCreateGameSeason = async (
  season: AdminGameSeasonFormValues,
) => {
  const { data, error } = await apiClient.api.v1['game-season'].post({
    expansionId: season.expansionId,
    name: season.name,
    description: season.description,
    startDate: season.startDate,
    endDate: season.endDate,
    sortOrder: season.sortOrder,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建赛季失败');
  }

  return data.data;
};

export const adminUpdateGameSeason = async (
  seasonId: string,
  season: Omit<AdminGameSeasonFormValues, 'expansionId'>,
) => {
  const { data, error } = await apiClient.api.v1['game-season']({
    id: seasonId,
  }).patch({
    name: season.name,
    description: season.description,
    startDate: season.startDate,
    endDate: season.endDate,
    sortOrder: season.sortOrder,
  });

  if (error) {
    throw new Error(error.value.message ?? '更新赛季失败');
  }

  return data.data;
};

export const adminDeleteGameSeason = async (seasonId: string) => {
  const { error } = await apiClient.api.v1['game-season']({
    id: seasonId,
  }).delete();

  if (error) {
    throw new Error(error.value.message ?? '删除赛季失败');
  }
};
