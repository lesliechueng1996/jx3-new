import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pinyinGet, searchPost } = vi.hoisted(() => ({
  pinyinGet: vi.fn(),
  searchPost: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        idiom: {
          pinyin: { get: pinyinGet },
          search: { post: searchPost },
        },
      },
    },
  },
}));

describe('idiom-guess-api', () => {
  beforeEach(() => {
    pinyinGet.mockReset();
    searchPost.mockReset();
  });

  it('resolves pinyin and search payloads', async () => {
    pinyinGet.mockResolvedValue({
      data: { data: { text: '一心一意', inDatabase: true, cells: [] } },
      error: null,
    });
    searchPost.mockResolvedValue({
      data: { data: { items: [], total: 0 } },
      error: null,
    });

    const { getPinyinByText, searchIdioms } = await import(
      '@/lib/api/admin/idiom-guess-api'
    );

    await expect(getPinyinByText('一心一意')).resolves.toEqual({
      text: '一心一意',
      inDatabase: true,
      cells: [],
    });
    await expect(searchIdioms({ rounds: [], limit: 15 })).resolves.toEqual({
      items: [],
      total: 0,
    });
  });

  it('throws API or fallback messages', async () => {
    pinyinGet.mockResolvedValueOnce({
      error: { value: { message: '拼音失败' } },
    });
    pinyinGet.mockResolvedValueOnce({ error: { value: {} } });
    searchPost.mockResolvedValueOnce({
      error: { value: { message: '搜索失败' } },
    });
    searchPost.mockResolvedValueOnce({ error: { value: {} } });

    const { getPinyinByText, searchIdioms } = await import(
      '@/lib/api/admin/idiom-guess-api'
    );

    await expect(getPinyinByText('一心一意')).rejects.toThrow('拼音失败');
    await expect(getPinyinByText('一心一意')).rejects.toThrow(
      '获取成语拼音失败',
    );
    await expect(searchIdioms({ rounds: [], limit: 1 })).rejects.toThrow(
      '搜索失败',
    );
    await expect(searchIdioms({ rounds: [], limit: 1 })).rejects.toThrow(
      '搜索成语失败',
    );
  });
});
