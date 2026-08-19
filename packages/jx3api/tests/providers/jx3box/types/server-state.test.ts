import { describe, expect, it } from 'bun:test';
import {
  type Jx3boxServerStateRaw,
  mapServerState,
} from '../../../../src/providers/jx3box/types/server-state';

describe('mapServerState', () => {
  it('maps snake_case upstream fields onto camelCase', () => {
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

    expect(mapServerState(raw)).toEqual({
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
    });
  });
});
