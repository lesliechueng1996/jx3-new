import { buildItemIconUrl } from '../config';

/** Raw attribute entry from jx3box item search. */
export interface Jx3boxItemSearchAttributeRaw {
  label: string;
}

/** Raw item entry from jx3box `item/search`. */
export interface Jx3boxItemSearchItemRaw {
  id: string;
  Name: string;
  Level: number;
  IconID: number;
  MagicType: string | null;
  attributes: Jx3boxItemSearchAttributeRaw[] | null;
}

/** Paginated item list inside the jx3box item search envelope. */
export interface Jx3boxItemSearchDataRaw {
  current_page: number;
  per_page: number;
  total: number;
  data: Jx3boxItemSearchItemRaw[];
}

/** Raw payload returned by jx3box `item/search` endpoint. */
export interface Jx3boxItemSearchRaw {
  code: number;
  msg: string;
  data: Jx3boxItemSearchDataRaw;
}

/** Normalized item search result used across the monorepo. */
export interface ItemSearch {
  id: string;
  level: number;
  iconId: number;
  iconUrl: string;
  description: string;
}

export function mapItemSearch(raw: Jx3boxItemSearchItemRaw): ItemSearch {
  const attributeLabels = (raw.attributes ?? []).map(
    (attribute) => attribute.label,
  );
  const description = [raw.MagicType, ...attributeLabels]
    .filter((part): part is string => Boolean(part))
    .join('\n');

  return {
    id: raw.id,
    level: raw.Level,
    iconId: raw.IconID,
    iconUrl: buildItemIconUrl(raw.IconID),
    description,
  };
}
