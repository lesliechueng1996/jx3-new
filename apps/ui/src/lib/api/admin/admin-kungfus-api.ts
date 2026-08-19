import { apiClient } from '@/lib/api-client';

export type KungfuType = 'defense' | 'heal' | 'attack';
export type AttackType = 'internal' | 'external';
export type AttackMethod = 'melee' | 'ranged';

export type ListKungfusFilters = {
  page: number;
  pageSize: number;
  name?: string;
  schoolId?: string;
  kungfuType?: KungfuType;
  isUnlimited?: boolean;
};

export const adminListKungfus = async (filters: ListKungfusFilters) => {
  const { data, error } = await apiClient.api.v1.kungfu.get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      name: filters.name,
      schoolId: filters.schoolId,
      kungfuType: filters.kungfuType,
      isUnlimited: filters.isUnlimited,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取心法列表失败');
  }

  return data.data;
};

export type AdminKungfuListItem = Awaited<
  ReturnType<typeof adminListKungfus>
>['items'][number];

export type AdminKungfuFormValues = {
  name: string;
  schoolId: string;
  kungfuType: KungfuType;
  attackType: AttackType | null;
  attackMethod: AttackMethod | null;
  formationName: string | null;
  formationEffect: string | null;
  isPveExternalRecommended: boolean;
  isPveInternalRecommended: boolean;
  isUnlimited: boolean;
  icon: string | null;
  alias: string[];
};

export const adminCreateKungfu = async (kungfu: AdminKungfuFormValues) => {
  const { data, error } = await apiClient.api.v1.kungfu.post({
    name: kungfu.name,
    schoolId: kungfu.schoolId,
    kungfuType: kungfu.kungfuType,
    attackType: kungfu.attackType,
    attackMethod: kungfu.attackMethod,
    formationName: kungfu.formationName,
    formationEffect: kungfu.formationEffect,
    isPveExternalRecommended: kungfu.isPveExternalRecommended,
    isPveInternalRecommended: kungfu.isPveInternalRecommended,
    isUnlimited: kungfu.isUnlimited,
    icon: kungfu.icon,
    alias: kungfu.alias,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建心法失败');
  }

  return data.data;
};

export const adminUpdateKungfu = async (
  kungfuId: string,
  kungfu: AdminKungfuFormValues,
) => {
  const { data, error } = await apiClient.api.v1
    .kungfu({
      id: kungfuId,
    })
    .patch({
      name: kungfu.name,
      schoolId: kungfu.schoolId,
      kungfuType: kungfu.kungfuType,
      attackType: kungfu.attackType,
      attackMethod: kungfu.attackMethod,
      formationName: kungfu.formationName,
      formationEffect: kungfu.formationEffect,
      isPveExternalRecommended: kungfu.isPveExternalRecommended,
      isPveInternalRecommended: kungfu.isPveInternalRecommended,
      isUnlimited: kungfu.isUnlimited,
      icon: kungfu.icon,
      alias: kungfu.alias,
    });

  if (error) {
    throw new Error(error.value.message ?? '更新心法失败');
  }

  return data.data;
};

export const adminDeleteKungfu = async (kungfuId: string) => {
  const { error } = await apiClient.api.v1
    .kungfu({
      id: kungfuId,
    })
    .delete();

  if (error) {
    throw new Error(error.value.message ?? '删除心法失败');
  }
};
