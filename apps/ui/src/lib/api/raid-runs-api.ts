import { apiClient } from '@/lib/api-client';

export const updateRaidRunGameRaidId = async (
  raidRunId: string,
  gameRaidId: string,
) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  })['game-raid-id'].patch({
    gameRaidId,
  });

  if (error) {
    throw new Error(error.value.message ?? '记录副本ID失败');
  }

  return data.data;
};

export const updateRaidRunWages = async (
  raidRunId: string,
  wages: {
    totalIncome: number;
    subsidyAmount: number;
    wagePerPerson: number;
  },
) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  }).wages.patch(wages);

  if (error) {
    throw new Error(error.value.message ?? '记录工资失败');
  }

  return data.data;
};
