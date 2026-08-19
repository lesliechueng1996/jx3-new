import { apiClient } from '@/lib/api-client';

export const listAllSchools = async () => {
  const { data, error } = await apiClient.api.v1.school.all.get();

  if (error) {
    throw new Error(error.value.message ?? '获取门派列表失败');
  }

  return data.data;
};

export type SchoolListItem = Awaited<ReturnType<typeof listAllSchools>>[number];
