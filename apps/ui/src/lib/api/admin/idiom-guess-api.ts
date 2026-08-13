import { apiClient } from '@/lib/api-client';

export const getPinyinByText = async (text: string) => {
  const { data, error } = await apiClient.api.v1.idiom.pinyin.get({
    query: {
      text,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取成语拼音失败');
  }

  return data.data;
};

type GuessRound = Parameters<
  typeof apiClient.api.v1.idiom.search.post
>[0]['rounds'][number];

export const searchIdioms = async ({
  rounds,
  limit,
}: {
  rounds: GuessRound[];
  limit: number;
}) => {
  const { data, error } = await apiClient.api.v1.idiom.search.post({
    rounds,
    limit,
  });

  if (error) {
    throw new Error(error.value.message ?? '搜索成语失败');
  }

  return data.data;
};

export type SearchIdiomsResponseSchema = Awaited<
  ReturnType<typeof searchIdioms>
>;
