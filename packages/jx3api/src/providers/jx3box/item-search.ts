import type { Logger } from '@logtape/logtape';
import { fetchJson } from '../../client';
import { Jx3ApiError } from '../../errors';
import { JX3BOX_NODE_BASE_URL } from './config';
import {
  type ItemSearch,
  type Jx3boxItemSearchRaw,
  mapItemSearch,
} from './types/item-search';

const ITEM_SEARCH_PATH = '/api/node/item/search';

export interface SearchItemOptions {
  logger?: Logger;
}

/**
 * Searches JX3 items by keyword via jx3box node API and returns the first hit.
 * No authentication required.
 *
 * @see https://node.jx3box.com/api/node/item/search?keyword={keyword}&page=1&per=15&client=std
 */
export async function searchItem(
  keyword: string,
  options: SearchItemOptions = {},
): Promise<ItemSearch> {
  const url = `${JX3BOX_NODE_BASE_URL}${ITEM_SEARCH_PATH}?keyword=${encodeURIComponent(keyword)}&page=1&per=15&client=std`;
  const raw = await fetchJson<Jx3boxItemSearchRaw>(url, {
    logger: options.logger,
  });

  if (raw.code !== 200) {
    throw new Jx3ApiError(raw.msg || 'Upstream API returned an error', {
      code: 'UPSTREAM_ERROR',
    });
  }

  const firstItem = raw.data.data[0];

  if (!firstItem) {
    throw new Jx3ApiError(`No item found for keyword "${keyword}"`, {
      code: 'NOT_FOUND',
    });
  }

  return mapItemSearch(firstItem);
}
