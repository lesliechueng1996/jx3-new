import { apiClient } from '@/lib/api-client';

export type ListIdiomsFilters = {
  page: number;
  pageSize: number;
  text?: string;
};

export const adminListIdiomsPagination = async (filters: ListIdiomsFilters) => {
  const { data, error } = await apiClient.api.v1.idiom.get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      text: filters.text,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取成语列表失败');
  }

  return data.data;
};

export type AdminIdiomListItem = Awaited<
  ReturnType<typeof adminListIdiomsPagination>
>['items'][number];

export const adminDeleteIdiom = async (idiomId: string) => {
  const { error } = await apiClient.api.v1
    .idiom({
      id: idiomId,
    })
    .delete();

  if (error) {
    throw new Error(error.value.message ?? '删除成语失败');
  }
};

export type AdminIdiomCreateFormValues = {
  text: string;
  meaning: string | null;
};

export const adminCreateIdiom = async (idiom: AdminIdiomCreateFormValues) => {
  const { data, error } = await apiClient.api.v1.idiom.post({
    text: idiom.text,
    meaning: idiom.meaning ?? undefined,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建成语失败');
  }

  return data.data;
};

export const adminGetIdiomDetail = async (idiomId: string) => {
  const { data, error } = await apiClient.api.v1
    .idiom({
      id: idiomId,
    })
    .get();

  if (error) {
    throw new Error(error.value.message ?? '获取成语详情失败');
  }

  return data.data;
};

export type AdminIdiomDetail = Awaited<ReturnType<typeof adminGetIdiomDetail>>;

export type AdminIdiomCharFormValues = {
  id: string;
  position: number;
  char: string;
  pinyin: string;
  initial: string;
  final: string;
  tone: number;
};

export type AdminIdiomEditFormValues = {
  text: string;
  pinyin: string;
  tonePattern: string;
  meaning: string | null;
  chars: AdminIdiomCharFormValues[];
};

export const adminUpdateIdiom = async (
  idiomId: string,
  idiom: AdminIdiomEditFormValues,
) => {
  const { data, error } = await apiClient.api.v1
    .idiom({
      id: idiomId,
    })
    .patch({
      text: idiom.text,
      pinyin: idiom.pinyin,
      tonePattern: idiom.tonePattern,
      meaning: idiom.meaning ?? undefined,
      chars: idiom.chars.map((item) => ({
        id: item.id,
        position: item.position,
        char: item.char,
        pinyin: item.pinyin,
        initial: item.initial,
        final: item.final,
        tone: item.tone,
      })),
    });

  if (error) {
    throw new Error(error.value.message ?? '更新成语失败');
  }

  return data.data;
};

export const adminImportIdiomsFromCsvFile = async (file: File) => {
  const { data, error } = await apiClient.api.v1.idiom.import.post({
    file: file,
  });

  if (error) {
    throw new Error(error.value.message ?? '导入成语失败');
  }

  return data.data;
};
