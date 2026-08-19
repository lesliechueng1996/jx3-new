import { apiClient } from '@/lib/api-client';

export type SchoolType = 'school' | 'genre';

export type ListSchoolsFilters = {
  page: number;
  pageSize: number;
  name?: string;
  type?: SchoolType;
};

export const adminListSchools = async (filters: ListSchoolsFilters) => {
  const { data, error } = await apiClient.api.v1.school.get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      name: filters.name,
      type: filters.type,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取门派列表失败');
  }

  return data.data;
};

export type AdminSchoolListItem = Awaited<
  ReturnType<typeof adminListSchools>
>['items'][number];

export type AdminSchoolFormValues = {
  name: string;
  type: SchoolType;
  icon: string | null;
  alias: string[];
};

export const adminCreateSchool = async (school: AdminSchoolFormValues) => {
  const { data, error } = await apiClient.api.v1.school.post({
    name: school.name,
    type: school.type,
    icon: school.icon,
    alias: school.alias,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建门派失败');
  }

  return data.data;
};

export const adminUpdateSchool = async (
  schoolId: string,
  school: AdminSchoolFormValues,
) => {
  const { data, error } = await apiClient.api.v1
    .school({
      id: schoolId,
    })
    .patch({
      name: school.name,
      type: school.type,
      icon: school.icon,
      alias: school.alias,
    });

  if (error) {
    throw new Error(error.value.message ?? '更新门派失败');
  }

  return data.data;
};

export const adminDeleteSchool = async (schoolId: string) => {
  const { error } = await apiClient.api.v1
    .school({
      id: schoolId,
    })
    .delete();

  if (error) {
    throw new Error(error.value.message ?? '删除门派失败');
  }
};
