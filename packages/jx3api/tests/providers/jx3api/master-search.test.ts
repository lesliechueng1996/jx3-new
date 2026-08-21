import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Jx3ApiError } from '../../../src/errors';
import type {
  Jx3apiEnvelopeRaw,
  Jx3apiMasterSearchDataRaw,
  Jx3apiServerStatusCheckDataRaw,
} from '../../../src/providers/jx3api/types/master-search';

const fetchJson = mock((..._args: unknown[]) =>
  Promise.resolve({} as Jx3apiEnvelopeRaw<Jx3apiServerStatusCheckDataRaw>),
);

mock.module('../../../src/client', () => ({
  fetchJson,
}));

const { searchGameServer, trySearchGameServer } = await import(
  '../../../src/providers/jx3api/master-search'
);

const raw: Jx3apiMasterSearchDataRaw = {
  server: '梦江南',
  lasttime: 1_786_935_237,
  shuttime: 1_786_919_757,
  status: 1,
  zone: '电信区',
};

const envelope = (
  overrides: Partial<Jx3apiEnvelopeRaw<Jx3apiServerStatusCheckDataRaw>> = {},
): Jx3apiEnvelopeRaw<Jx3apiServerStatusCheckDataRaw> => ({
  code: 200,
  msg: 'success',
  data: [raw],
  time: 1_700_000_000,
  ...overrides,
});

const mapped = {
  zone: '电信区',
  name: '梦江南',
  status: 1,
  lastTime: 1_786_935_237,
  shutTime: 1_786_919_757,
};

const statusCheckUrl =
  'https://www.jx3api.com/server/status/check?server=%E6%A2%A6%E6%B1%9F%E5%8D%97&type=1';

beforeEach(() => {
  fetchJson.mockReset();
});

describe('trySearchGameServer', () => {
  it('requests the encoded server name with type=1 and maps the first item', async () => {
    fetchJson.mockImplementation(() => Promise.resolve(envelope()));

    await expect(trySearchGameServer('梦江南')).resolves.toEqual(mapped);
    expect(fetchJson).toHaveBeenCalledWith(statusCheckUrl, {
      logger: undefined,
    });
  });

  it('forwards a logger to fetchJson', async () => {
    const logger = { debug: mock(() => undefined) };
    fetchJson.mockImplementation(() => Promise.resolve(envelope()));

    await trySearchGameServer('梦江南', { logger: logger as never });

    expect(fetchJson).toHaveBeenCalledWith(statusCheckUrl, { logger });
  });

  it('returns null when upstream reports the server as missing', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(envelope({ code: 400, msg: 'not found' })),
    );

    await expect(trySearchGameServer('不存在')).resolves.toBeNull();
  });

  it('returns null when upstream returns an empty object', async () => {
    fetchJson.mockImplementation(() => Promise.resolve(envelope({ data: {} })));

    await expect(trySearchGameServer('双梦')).resolves.toBeNull();
  });

  it('returns null when upstream returns an empty list', async () => {
    fetchJson.mockImplementation(() => Promise.resolve(envelope({ data: [] })));

    await expect(trySearchGameServer('双梦')).resolves.toBeNull();
  });

  it('returns null when the first list slot is empty', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(envelope({ data: [undefined as never] })),
    );

    await expect(trySearchGameServer('双梦')).resolves.toBeNull();
  });

  it('throws UPSTREAM_ERROR for other non-success codes', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(envelope({ code: 500, msg: 'boom' })),
    );

    try {
      await trySearchGameServer('梦江南');
      throw new Error('expected trySearchGameServer to throw');
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
      Promise.resolve(envelope({ code: 500, msg: '' })),
    );

    try {
      await trySearchGameServer('梦江南');
      throw new Error('expected trySearchGameServer to throw');
    } catch (error) {
      expect(error).toMatchObject({
        message: 'Upstream API returned an error',
        code: 'UPSTREAM_ERROR',
      });
    }
  });
});

describe('searchGameServer', () => {
  it('maps a successful payload', async () => {
    fetchJson.mockImplementation(() => Promise.resolve(envelope()));

    await expect(searchGameServer('梦江南')).resolves.toEqual(mapped);
  });

  it('throws UPSTREAM_ERROR when the envelope is not successful', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(envelope({ code: 400, msg: 'not found' })),
    );

    try {
      await searchGameServer('不存在');
      throw new Error('expected searchGameServer to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Jx3ApiError);
      expect(error).toMatchObject({
        message: 'not found',
        code: 'UPSTREAM_ERROR',
      });
    }
  });

  it('throws UPSTREAM_ERROR when upstream returns empty data', async () => {
    fetchJson.mockImplementation(() => Promise.resolve(envelope({ data: {} })));

    try {
      await searchGameServer('双梦');
      throw new Error('expected searchGameServer to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Jx3ApiError);
      expect(error).toMatchObject({
        message: 'success',
        code: 'UPSTREAM_ERROR',
      });
    }
  });

  it('falls back to a default message when upstream msg is empty', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(envelope({ code: 400, msg: '' })),
    );

    try {
      await searchGameServer('不存在');
      throw new Error('expected searchGameServer to throw');
    } catch (error) {
      expect(error).toMatchObject({
        message: 'Upstream API returned an error',
        code: 'UPSTREAM_ERROR',
      });
    }
  });

  it('falls back to a default message when empty data has an empty msg', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(envelope({ data: {}, msg: '' })),
    );

    try {
      await searchGameServer('双梦');
      throw new Error('expected searchGameServer to throw');
    } catch (error) {
      expect(error).toMatchObject({
        message: 'Upstream API returned an error',
        code: 'UPSTREAM_ERROR',
      });
    }
  });
});
