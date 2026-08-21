/** Raw server status item from jx3api `server/status/check?type=1`. */
export interface Jx3apiMasterSearchDataRaw {
  server: string;
  lasttime: number;
  shuttime: number;
  status: number;
  zone: string;
}

/**
 * Payload of `server/status/check?type=1`.
 * A matching server returns an array; a miss returns an empty object.
 */
export type Jx3apiServerStatusCheckDataRaw =
  | Jx3apiMasterSearchDataRaw[]
  | Record<string, never>;

/** Envelope returned by jx3api.com APIs. */
export interface Jx3apiEnvelopeRaw<T> {
  code: number;
  msg: string;
  data: T;
  time: number;
}

/** Normalized game server status used across the monorepo. */
export interface GameServerDetail {
  zone: string;
  name: string;
  status: number;
  lastTime: number;
  shutTime: number;
}

export function isServerStatusCheckList(
  data: Jx3apiServerStatusCheckDataRaw,
): data is Jx3apiMasterSearchDataRaw[] {
  return Array.isArray(data);
}

export function mapMasterSearchData(
  raw: Jx3apiMasterSearchDataRaw,
): GameServerDetail {
  return {
    zone: raw.zone,
    name: raw.server,
    status: raw.status,
    lastTime: raw.lasttime,
    shutTime: raw.shuttime,
  };
}
