import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Jx3ApiError } from '../../../src/errors';
import type {
  Jx3boxItemSearchItemRaw,
  Jx3boxItemSearchRaw,
} from '../../../src/providers/jx3box/types/item-search';

const fetchJson = mock((..._args: unknown[]) =>
  Promise.resolve({} as Jx3boxItemSearchRaw),
);

mock.module('../../../src/client', () => ({
  fetchJson,
}));

const { searchItem } = await import(
  '../../../src/providers/jx3box/item-search'
);

const item = (
  overrides: Partial<Jx3boxItemSearchItemRaw> = {},
): Jx3boxItemSearchItemRaw => ({
  id: '6_42729',
  Level: 35300,
  IconID: 25571,
  MagicType: '130级武器用破防无双',
  attributes: [{ label: '武器伤害提高2737-4562' }, { label: '速度1.0' }],
  ...overrides,
});

const payload = (
  items: Jx3boxItemSearchItemRaw[] = [item()],
  overrides: Partial<Jx3boxItemSearchRaw> = {},
): Jx3boxItemSearchRaw => ({
  code: 200,
  msg: '物品列表',
  data: {
    current_page: 1,
    per_page: 15,
    total: items.length,
    data: items,
  },
  ...overrides,
});

const searchUrl =
  'https://node.jx3box.com/api/node/item/search?keyword=%E7%9D%A1%E8%B5%B7%E6%8E%A8%E7%AF%B7&page=1&per=15&client=std';

beforeEach(() => {
  fetchJson.mockReset();
});

describe('searchItem', () => {
  it('requests the encoded keyword and maps the first item', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(payload([item(), item({ id: '6_99999', IconID: 1 })])),
    );

    await expect(searchItem('睡起推篷')).resolves.toEqual({
      id: '6_42729',
      level: 35300,
      iconId: 25571,
      iconUrl: 'https://icon.jx3box.com/icon/25571.png',
      description: '130级武器用破防无双\n武器伤害提高2737-4562\n速度1.0',
    });
    expect(fetchJson).toHaveBeenCalledWith(searchUrl, {
      logger: undefined,
    });
  });

  it('forwards a logger to fetchJson', async () => {
    const logger = { debug: mock(() => undefined) };
    fetchJson.mockImplementation(() => Promise.resolve(payload()));

    await searchItem('睡起推篷', { logger: logger as never });

    expect(fetchJson).toHaveBeenCalledWith(searchUrl, { logger });
  });

  it('throws NOT_FOUND when upstream returns no items', async () => {
    fetchJson.mockImplementation(() => Promise.resolve(payload([])));

    try {
      await searchItem('不存在');
      throw new Error('expected searchItem to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Jx3ApiError);
      expect(error).toMatchObject({
        message: 'No item found for keyword "不存在"',
        code: 'NOT_FOUND',
      });
    }
  });

  it('throws UPSTREAM_ERROR when the envelope is not successful', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(payload([], { code: 500, msg: 'boom' })),
    );

    try {
      await searchItem('睡起推篷');
      throw new Error('expected searchItem to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Jx3ApiError);
      expect(error).toMatchObject({
        message: 'boom',
        code: 'UPSTREAM_ERROR',
      });
    }
  });

  it('falls back to a default message when upstream msg is empty', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(payload([], { code: 500, msg: '' })),
    );

    try {
      await searchItem('睡起推篷');
      throw new Error('expected searchItem to throw');
    } catch (error) {
      expect(error).toMatchObject({
        message: 'Upstream API returned an error',
        code: 'UPSTREAM_ERROR',
      });
    }
  });
});
