import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { Jx3boxServerStateRaw } from '../../../src/providers/jx3box/types/server-state';

const fetchJson = mock((..._args: unknown[]) =>
  Promise.resolve([] as Jx3boxServerStateRaw[]),
);

mock.module('../../../src/client', () => ({
  fetchJson,
}));

const { getServerStates } = await import(
  '../../../src/providers/jx3box/server-state'
);

const raw: Jx3boxServerStateRaw = {
  zone_name: '电信一区',
  server_name: '梦江南',
  ip_address: '1.2.3.4',
  ip_port: '8080',
  channel: 'std',
  connect_state: true,
  heat: 'hot',
  maintain_time: 1_700_000_000,
  delay: 32,
  main_server: '梦江南',
};

beforeEach(() => {
  fetchJson.mockReset();
});

describe('getServerStates', () => {
  it('fetches and maps every server state', async () => {
    fetchJson.mockImplementation(() => Promise.resolve([raw]));

    await expect(getServerStates()).resolves.toEqual([
      {
        zoneName: '电信一区',
        serverName: '梦江南',
        ipAddress: '1.2.3.4',
        ipPort: '8080',
        channel: 'std',
        connectState: true,
        heat: 'hot',
        maintainTime: 1_700_000_000,
        delay: 32,
        mainServer: '梦江南',
      },
    ]);
    expect(fetchJson).toHaveBeenCalledWith(
      'https://spider2.jx3box.com/api/spider/server/server_state',
      { logger: undefined },
    );
  });

  it('returns an empty list when upstream has no servers', async () => {
    fetchJson.mockImplementation(() => Promise.resolve([]));

    await expect(getServerStates()).resolves.toEqual([]);
  });

  it('forwards a logger to fetchJson', async () => {
    const logger = { debug: mock(() => undefined) };
    fetchJson.mockImplementation(() => Promise.resolve([]));

    await getServerStates({ logger: logger as never });

    expect(fetchJson).toHaveBeenCalledWith(
      'https://spider2.jx3box.com/api/spider/server/server_state',
      { logger },
    );
  });
});
