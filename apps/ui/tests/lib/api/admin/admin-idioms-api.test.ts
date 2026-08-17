import { beforeEach, describe, expect, it, vi } from 'vitest';

const { idiomGet, idiomPost, idiomDelete, idiomPatch, idiomImportPost } =
  vi.hoisted(() => ({
    idiomGet: vi.fn(),
    idiomPost: vi.fn(),
    idiomDelete: vi.fn(),
    idiomPatch: vi.fn(),
    idiomImportPost: vi.fn(),
  }));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        idiom: Object.assign(
          (params: { id: string }) => ({
            get: () => idiomGet(params),
            delete: () => idiomDelete(params),
            patch: (body: unknown) => idiomPatch(params, body),
          }),
          {
            get: idiomGet,
            post: idiomPost,
            import: { post: idiomImportPost },
          },
        ),
      },
    },
  },
}));

describe('admin-idioms-api', () => {
  beforeEach(() => {
    idiomGet.mockReset();
    idiomPost.mockReset();
    idiomDelete.mockReset();
    idiomPatch.mockReset();
    idiomImportPost.mockReset();
  });

  it('lists idioms and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', text: '一心一意' }], total: 1 };
    idiomGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListIdiomsPagination } = await import(
      '@/lib/api/admin/admin-idioms-api'
    );
    await expect(
      adminListIdiomsPagination({ page: 1, pageSize: 20, text: '一' }),
    ).resolves.toEqual(payload);
    expect(idiomGet).toHaveBeenCalledWith({
      query: { page: 1, pageSize: 20, text: '一' },
    });
  });

  it('throws the API message when listing fails', async () => {
    idiomGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListIdiomsPagination } = await import(
      '@/lib/api/admin/admin-idioms-api'
    );
    await expect(
      adminListIdiomsPagination({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('列表失败');
  });

  it('uses the fallback message when the API omits one', async () => {
    idiomGet.mockResolvedValue({
      data: null,
      error: { value: { message: undefined } },
    });
    const { adminListIdiomsPagination } = await import(
      '@/lib/api/admin/admin-idioms-api'
    );
    await expect(
      adminListIdiomsPagination({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取成语列表失败');
  });

  it('deletes, creates, loads, updates, and imports', async () => {
    idiomDelete.mockResolvedValue({ error: null });
    idiomPost.mockResolvedValue({
      data: { data: { id: 'n' } },
      error: null,
    });
    idiomGet.mockResolvedValue({
      data: { data: { id: '1', text: '一心一意', chars: [] } },
      error: null,
    });
    idiomPatch.mockResolvedValue({
      data: { data: { id: '1' } },
      error: null,
    });
    idiomImportPost.mockResolvedValue({
      data: { data: { created: 1, skipped: 0, failed: 0 } },
      error: null,
    });

    const api = await import('@/lib/api/admin/admin-idioms-api');

    await api.adminDeleteIdiom('1');
    await expect(
      api.adminCreateIdiom({ text: '一心一意', meaning: null }),
    ).resolves.toEqual({ id: 'n' });
    await expect(api.adminGetIdiomDetail('1')).resolves.toMatchObject({
      id: '1',
    });
    await expect(
      api.adminUpdateIdiom('1', {
        text: '一心一意',
        pinyin: 'yi1 xin1 yi1 yi4',
        tonePattern: '1114',
        meaning: null,
        chars: [
          {
            id: 'c1',
            position: 0,
            char: '一',
            pinyin: 'yi1',
            initial: '',
            final: 'i',
            tone: 1,
          },
        ],
      }),
    ).resolves.toEqual({ id: '1' });
    const file = new File(['text\n一心一意'], 'idioms.csv', {
      type: 'text/csv',
    });
    await expect(api.adminImportIdiomsFromCsvFile(file)).resolves.toEqual({
      created: 1,
      skipped: 0,
      failed: 0,
    });
  });

  it('throws fallbacks on mutating failures', async () => {
    idiomDelete.mockResolvedValue({ error: { value: {} } });
    idiomPost.mockResolvedValue({ error: { value: {} } });
    idiomGet.mockResolvedValue({ error: { value: {} } });
    idiomPatch.mockResolvedValue({ error: { value: {} } });
    idiomImportPost.mockResolvedValue({ error: { value: {} } });

    const api = await import('@/lib/api/admin/admin-idioms-api');

    await expect(api.adminDeleteIdiom('1')).rejects.toThrow('删除成语失败');
    await expect(
      api.adminCreateIdiom({ text: '一心一意', meaning: '释义' }),
    ).rejects.toThrow('创建成语失败');
    await expect(api.adminGetIdiomDetail('1')).rejects.toThrow(
      '获取成语详情失败',
    );
    await expect(
      api.adminUpdateIdiom('1', {
        text: 'a',
        pinyin: 'a',
        tonePattern: '1',
        meaning: 'x',
        chars: [],
      }),
    ).rejects.toThrow('更新成语失败');
    await expect(
      api.adminImportIdiomsFromCsvFile(new File([''], 'a.csv')),
    ).rejects.toThrow('导入成语失败');
  });
});
