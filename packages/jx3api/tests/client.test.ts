import { afterEach, describe, expect, it, mock } from 'bun:test';
import type { Logger } from '@logtape/logtape';
import { fetchJson } from '../src/client';
import { Jx3ApiError } from '../src/errors';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const mockLogger = () => {
  const debug = mock((_message: string) => undefined);
  return { debug, logger: { debug } as unknown as Logger };
};

describe('fetchJson', () => {
  it('returns parsed JSON from a successful response', async () => {
    const fetchMock = mock(() => Promise.resolve(jsonResponse({ ok: true })));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      fetchJson<{ ok: boolean }>('https://example.test'),
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('https://example.test', {});
  });

  it('strips logger from fetch init and logs the default GET method', async () => {
    const { debug, logger } = mockLogger();
    const fetchMock = mock(() => Promise.resolve(jsonResponse({ id: 1 })));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await fetchJson('https://example.test/items', { logger });

    expect(debug).toHaveBeenCalledWith(
      'jx3api request to https://example.test/items with method GET',
    );
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/items', {});
  });

  it('logs a custom HTTP method and forwards remaining init', async () => {
    const { debug, logger } = mockLogger();
    const fetchMock = mock(() => Promise.resolve(jsonResponse({ id: 1 })));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const headers = { Accept: 'application/json' };

    await fetchJson('https://example.test/items', {
      logger,
      method: 'POST',
      headers,
    });

    expect(debug).toHaveBeenCalledWith(
      'jx3api request to https://example.test/items with method POST',
    );
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/items', {
      method: 'POST',
      headers,
    });
  });

  it('wraps a network failure as NETWORK_ERROR', async () => {
    const cause = new Error('offline');
    globalThis.fetch = mock(() =>
      Promise.reject(cause),
    ) as unknown as typeof fetch;

    try {
      await fetchJson('https://example.test');
      throw new Error('expected fetchJson to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Jx3ApiError);
      expect(error).toMatchObject({
        message: 'Failed to reach upstream API',
        code: 'NETWORK_ERROR',
        cause,
      });
    }
  });

  it('throws HTTP_ERROR when the response is not ok', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('nope', { status: 502 })),
    ) as unknown as typeof fetch;

    try {
      await fetchJson('https://example.test');
      throw new Error('expected fetchJson to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Jx3ApiError);
      expect(error).toMatchObject({
        message: 'Upstream API returned 502',
        code: 'HTTP_ERROR',
        status: 502,
      });
    }
  });

  it('throws PARSE_ERROR when the body is not JSON', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response('not-json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ) as unknown as typeof fetch;

    try {
      await fetchJson('https://example.test');
      throw new Error('expected fetchJson to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Jx3ApiError);
      expect(error).toMatchObject({
        message: 'Failed to parse upstream JSON response',
        code: 'PARSE_ERROR',
        status: 200,
      });
      expect((error as Jx3ApiError).cause).toBeDefined();
    }
  });
});
