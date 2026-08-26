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
const ITEM_SEARCH_PER_PAGE = 15;
const MAX_ITEM_SEARCH_PAGES = 5;

export interface SearchItemOptions {
  logger?: Logger;
}

const buildItemSearchUrl = (keyword: string, page: number): string =>
  `${JX3BOX_NODE_BASE_URL}${ITEM_SEARCH_PATH}?keyword=${encodeURIComponent(keyword)}&page=${page}&per=${ITEM_SEARCH_PER_PAGE}&client=std`;

/**
 * Searches JX3 items by keyword via jx3box node API.
 * When multiple hits exist, returns the item whose Name matches keyword,
 * scanning up to 5 pages. No authentication required.
 *
 * @see https://node.jx3box.com/api/node/item/search?keyword={keyword}&page=1&per=15&client=std
 */
export async function searchItem(
  keyword: string,
  options: SearchItemOptions = {},
): Promise<ItemSearch> {
  for (let page = 1; page <= MAX_ITEM_SEARCH_PAGES; page += 1) {
    const raw = await fetchItemSearchPage(keyword, page, options.logger);
    const items = raw.data.data;
    const [firstItem] = items;

    if (!firstItem) {
      break;
    }

    if (raw.data.total <= 1) {
      return mapItemSearch(firstItem);
    }

    const matched = items.find((entry) => entry.Name === keyword);
    if (matched) {
      return mapItemSearch(matched);
    }

    const lastPage = Math.ceil(raw.data.total / raw.data.per_page);
    if (page >= lastPage) {
      break;
    }
  }

  throw new Jx3ApiError(`No item found for keyword "${keyword}"`, {
    code: 'NOT_FOUND',
  });
}

const fetchItemSearchPage = async (
  keyword: string,
  page: number,
  logger: Logger | undefined,
): Promise<Jx3boxItemSearchRaw> => {
  const url = buildItemSearchUrl(keyword, page);
  const raw = await fetchJson<Jx3boxItemSearchRaw>(url, { logger });

  if (raw.code !== 200) {
    throw new Jx3ApiError(raw.msg || 'Upstream API returned an error', {
      code: 'UPSTREAM_ERROR',
    });
  }

  return raw;
};
