import type { Logger } from '@logtape/logtape';
import { fetchJson } from '../../client';
import { Jx3ApiError } from '../../errors';
import { JX3API_BASE_URL } from './config';
import {
  type GameServerDetail,
  isServerStatusCheckList,
  type Jx3apiEnvelopeRaw,
  type Jx3apiMasterSearchDataRaw,
  type Jx3apiServerStatusCheckDataRaw,
  mapMasterSearchData,
} from './types/master-search';

const SERVER_STATUS_CHECK_PATH = '/server/status/check';
const SERVER_STATUS_CHECK_TYPE = 1;

export interface SearchGameServerOptions {
  logger?: Logger;
}

/**
 * Looks up JX3 game server status by server name via jx3api.com.
 * No authentication required.
 *
 * @see https://www.jx3api.com/server/status/check?server={server}&type=1
 */
const fetchMasterSearchEnvelope = (
  name: string,
  options: SearchGameServerOptions = {},
) => {
  const url = `${JX3API_BASE_URL}${SERVER_STATUS_CHECK_PATH}?server=${encodeURIComponent(name)}&type=${SERVER_STATUS_CHECK_TYPE}`;
  return fetchJson<Jx3apiEnvelopeRaw<Jx3apiServerStatusCheckDataRaw>>(url, {
    logger: options.logger,
  });
};

const firstStatusItem = (
  data: Jx3apiServerStatusCheckDataRaw,
): Jx3apiMasterSearchDataRaw | null => {
  if (!isServerStatusCheckList(data) || data.length === 0) {
    return null;
  }

  return data[0] ?? null;
};

/**
 * Looks up JX3 game server status by name. Returns null when upstream
 * reports the server as missing (code 400 or empty data).
 */
export async function trySearchGameServer(
  name: string,
  options: SearchGameServerOptions = {},
): Promise<GameServerDetail | null> {
  const envelope = await fetchMasterSearchEnvelope(name, options);

  if (envelope.code === 400) {
    return null;
  }

  if (envelope.code !== 200) {
    throw new Jx3ApiError(envelope.msg || 'Upstream API returned an error', {
      code: 'UPSTREAM_ERROR',
    });
  }

  const item = firstStatusItem(envelope.data);
  if (!item) {
    return null;
  }

  return mapMasterSearchData(item);
}

export async function searchGameServer(
  name: string,
  options: SearchGameServerOptions = {},
): Promise<GameServerDetail> {
  const envelope = await fetchMasterSearchEnvelope(name, options);

  if (envelope.code !== 200) {
    throw new Jx3ApiError(envelope.msg || 'Upstream API returned an error', {
      code: 'UPSTREAM_ERROR',
    });
  }

  const item = firstStatusItem(envelope.data);
  if (!item) {
    throw new Jx3ApiError(envelope.msg || 'Upstream API returned an error', {
      code: 'UPSTREAM_ERROR',
    });
  }

  return mapMasterSearchData(item);
}
