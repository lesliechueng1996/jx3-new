import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Jx3ApiError } from '../../../src/errors';
import type {
  Jx3apiEnvelopeRaw,
  Jx3apiMasterSearchDataRaw,
} from '../../../src/providers/jx3api/types/master-search';

const fetchJson = mock((..._args: unknown[]) =>
  Promise.resolve({} as Jx3apiEnvelopeRaw<Jx3apiMasterSearchDataRaw>),
);

mock.module('../../../src/client', () => ({
  fetchJson,
}));

const { searchGameServer, trySearchGameServer } = await import(
  '../../../src/providers/jx3api/master-search'
);

const raw: Jx3apiMasterSearchDataRaw = {
  id: '42',
  center: '电信',
  zone: '电信一区',
  name: '梦江南',
  event: 1,
  voice: { 开服: [8, 30] },
  alias: ['梦江'],
  slave: ['绝代天骄'],
};

const envelope = (
  overrides: Partial<Jx3apiEnvelopeRaw<Jx3apiMasterSearchDataRaw>> = {},
): Jx3apiEnvelopeRaw<Jx3apiMasterSearchDataRaw> => ({
  code: 200,
  msg: 'success',
  data: raw,
  time: 1_700_000_000,
  ...overrides,
});

const mapped = {
  id: '42',
  center: '电信',
  zone: '电信一区',
  name: '梦江南',
  event: 1,
  voice: { 开服: [8, 30] },
  alias: ['梦江'],
  slaveServers: ['绝代天骄'],
};

beforeEach(() => {
  fetchJson.mockReset();
});

describe('trySearchGameServer', () => {
  it('requests the encoded server name and maps a successful payload', async () => {
    fetchJson.mockImplementation(() => Promise.resolve(envelope()));

    await expect(trySearchGameServer('梦江南')).resolves.toEqual(mapped);
    expect(fetchJson).toHaveBeenCalledWith(
      'https://www.jx3api.com/data/master/search?name=%E6%A2%A6%E6%B1%9F%E5%8D%97',
      { logger: undefined },
    );
  });

  it('forwards a logger to fetchJson', async () => {
    const logger = { debug: mock(() => undefined) };
    fetchJson.mockImplementation(() => Promise.resolve(envelope()));

    await trySearchGameServer('梦江南', { logger: logger as never });

    expect(fetchJson).toHaveBeenCalledWith(
      'https://www.jx3api.com/data/master/search?name=%E6%A2%A6%E6%B1%9F%E5%8D%97',
      { logger },
    );
  });

  it('returns null when upstream reports the server as missing', async () => {
    fetchJson.mockImplementation(() =>
      Promise.resolve(envelope({ code: 400, msg: 'not found' })),
    );

    await expect(trySearchGameServer('不存在')).resolves.toBeNull();
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
});
