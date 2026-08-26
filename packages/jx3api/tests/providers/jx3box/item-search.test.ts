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
  Name: '睡起推篷',
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

const mappedItem = {
  id: '6_42729',
  level: 35300,
  iconId: 25571,
  iconUrl: 'https://icon.jx3box.com/icon/25571.png',
  description: '130级武器用破防无双\n武器伤害提高2737-4562\n速度1.0',
};

const searchUrl = (page: number, keyword = '睡起推篷') =>
  `https://node.jx3box.com/api/node/item/search?keyword=${encodeURIComponent(keyword)}&page=${page}&per=15&client=std`;

const unmatchedItems = (
  count: number,
  page: number,
): Jx3boxItemSearchItemRaw[] =>
  Array.from({ length: count }, (_, index) =>
    item({
      id: `6_${page}_${index}`,
      Name: `其他${page}-${index}`,
      IconID: index + 1,
    }),
  );

beforeEach(() => {
  fetchJson.mockReset();
});

describe('searchItem', () => {
  it('requests page 1 and maps a single hit', async () => {
    fetchJson.mockImplementation(() => Promise.resolve(payload()));

    await expect(searchItem('睡起推篷')).resolves.toEqual(mappedItem);
    expect(fetchJson).toHaveBeenCalledTimes(1);
    expect(fetchJson).toHaveBeenCalledWith(searchUrl(1), {
      logger: undefined,
    });
  });

  it('returns the Name match when multiple hits exist on page 1', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(
        payload([
          item({ id: '6_1', Name: '其他', IconID: 1 }),
          item(),
          item({ id: '6_2', Name: '别的', IconID: 2 }),
        ]),
      ),
    );

    await expect(searchItem('睡起推篷')).resolves.toEqual(mappedItem);
    expect(fetchJson).toHaveBeenCalledTimes(1);
  });

  it('scans later pages until a Name match is found', async () => {
    fetchJson.mockImplementation((url: unknown) => {
      const href = String(url);
      if (href === searchUrl(1)) {
        return Promise.resolve(
          payload(unmatchedItems(15, 1), {
            data: {
              current_page: 1,
              per_page: 15,
              total: 16,
              data: unmatchedItems(15, 1),
            },
          }),
        );
      }
      if (href === searchUrl(2)) {
        return Promise.resolve(
          payload([item()], {
            data: {
              current_page: 2,
              per_page: 15,
              total: 16,
              data: [item()],
            },
          }),
        );
      }
      throw new Error(`unexpected url ${href}`);
    });

    await expect(searchItem('睡起推篷')).resolves.toEqual(mappedItem);
    expect(fetchJson).toHaveBeenCalledTimes(2);
    expect(fetchJson).toHaveBeenNthCalledWith(1, searchUrl(1), {
      logger: undefined,
    });
    expect(fetchJson).toHaveBeenNthCalledWith(2, searchUrl(2), {
      logger: undefined,
    });
  });

  it('stops after 5 pages when no Name match is found', async () => {
    fetchJson.mockImplementation((url: unknown) => {
      const href = String(url);
      const pageMatch = /[?&]page=(\d+)/.exec(href);
      const page = Number(pageMatch?.[1] ?? 0);
      const pageItems = unmatchedItems(15, page);
      return Promise.resolve(
        payload(pageItems, {
          data: {
            current_page: page,
            per_page: 15,
            total: 100,
            data: pageItems,
          },
        }),
      );
    });

    try {
      await searchItem('睡起推篷');
      throw new Error('expected searchItem to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Jx3ApiError);
      expect(error).toMatchObject({
        message: 'No item found for keyword "睡起推篷"',
        code: 'NOT_FOUND',
      });
    }
    expect(fetchJson).toHaveBeenCalledTimes(5);
    expect(fetchJson).toHaveBeenNthCalledWith(5, searchUrl(5), {
      logger: undefined,
    });
  });

  it('does not request further pages after the last available page', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(
        payload(unmatchedItems(2, 1), {
          data: {
            current_page: 1,
            per_page: 15,
            total: 2,
            data: unmatchedItems(2, 1),
          },
        }),
      ),
    );

    try {
      await searchItem('睡起推篷');
      throw new Error('expected searchItem to throw');
    } catch (error) {
      expect(error).toMatchObject({
        code: 'NOT_FOUND',
      });
    }
    expect(fetchJson).toHaveBeenCalledTimes(1);
  });

  it('forwards a logger to fetchJson', async () => {
    const logger = { debug: mock(() => undefined) };
    fetchJson.mockImplementation(() => Promise.resolve(payload()));

    await searchItem('睡起推篷', { logger: logger as never });

    expect(fetchJson).toHaveBeenCalledWith(searchUrl(1), { logger });
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
    expect(fetchJson).toHaveBeenCalledWith(searchUrl(1, '不存在'), {
      logger: undefined,
    });
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
