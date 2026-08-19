import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Jx3ApiError } from '../../../src/errors';
import type { Jx3boxIconByNameRaw } from '../../../src/providers/jx3box/types/icon-by-name';

const fetchJson = mock((..._args: unknown[]) =>
  Promise.resolve({} as Jx3boxIconByNameRaw),
);

mock.module('../../../src/client', () => ({
  fetchJson,
}));

const { getItemIconByName } = await import(
  '../../../src/providers/jx3box/icon-by-name'
);

const payload = (
  items: Jx3boxIconByNameRaw['item'] = [{ iconID: 13, Name: '五行石' }],
): Jx3boxIconByNameRaw => ({
  item: items,
  buff: [],
  skill: [],
});

beforeEach(() => {
  fetchJson.mockReset();
});

describe('getItemIconByName', () => {
  it('requests the encoded item name and maps the first icon', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(
        payload([
          { iconID: 13, Name: '五行石' },
          { iconID: 99, Name: 'ignored' },
        ]),
      ),
    );

    await expect(getItemIconByName('五行石')).resolves.toEqual({
      iconId: 13,
      name: '五行石',
      iconUrl: 'https://icon.jx3box.com/icon/13.png',
    });
    expect(fetchJson).toHaveBeenCalledWith(
      'https://node.jx3box.com/icon/name/%E4%BA%94%E8%A1%8C%E7%9F%B3?client=std',
      { logger: undefined },
    );
  });

  it('forwards a logger to fetchJson', async () => {
    const logger = { debug: mock(() => undefined) };
    fetchJson.mockImplementation(() => Promise.resolve(payload()));

    await getItemIconByName('五行石', { logger: logger as never });

    expect(fetchJson).toHaveBeenCalledWith(
      'https://node.jx3box.com/icon/name/%E4%BA%94%E8%A1%8C%E7%9F%B3?client=std',
      { logger },
    );
  });

  it('throws NOT_FOUND when upstream returns no items', async () => {
    fetchJson.mockImplementation(() => Promise.resolve(payload([])));

    try {
      await getItemIconByName('不存在');
      throw new Error('expected getItemIconByName to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Jx3ApiError);
      expect(error).toMatchObject({
        message: 'No icon found for item "不存在"',
        code: 'NOT_FOUND',
      });
    }
  });
});
