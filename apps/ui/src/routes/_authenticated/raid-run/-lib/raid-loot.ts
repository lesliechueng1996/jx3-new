import type { RaidSignup } from './raid-signup';

export {
  DEFAULT_QUICK_CREATE_ITEM_QUALITY,
  DEFAULT_QUICK_CREATE_ITEM_TYPE,
} from '@/lib/game-item-labels';

export const parseLootQuantity = (value: string): number | undefined => {
  if (value.length === 0) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    return undefined;
  }

  const quantity = Number.parseInt(value, 10);
  if (quantity < 1) {
    return undefined;
  }

  return quantity;
};

export type RaidLootWinnerOption = {
  id: string;
  characterName: string;
  serverName?: string;
};

export const formatRaidLootWinnerLabel = (
  option: Pick<RaidLootWinnerOption, 'characterName' | 'serverName'>,
): string =>
  [option.characterName, option.serverName]
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join(' · ');

export const formatRaidLootWinnerDisplay = (
  characterName: string | null | undefined,
  serverName: string | null | undefined,
): string => {
  const trimmed = characterName?.trim();
  if (!trimmed) {
    return '';
  }

  return formatRaidLootWinnerLabel({
    characterName: trimmed,
    serverName: serverName?.trim() || undefined,
  });
};

export const matchesRaidLootWinnerQuery = (
  option: RaidLootWinnerOption,
  query: string,
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (option.characterName.toLowerCase().includes(normalized)) {
    return true;
  }

  return Boolean(option.serverName?.toLowerCase().includes(normalized));
};

export const raidLootWinnerOptions = (
  signups: readonly RaidSignup[],
  servers: readonly { id: string; name: string }[],
): RaidLootWinnerOption[] => {
  const serverNameById = new Map(
    servers.map((server) => [server.id, server.name]),
  );

  return signups.flatMap((signup) => {
    const characterName = signup.characterName?.trim();
    if (!characterName) {
      return [];
    }

    const serverName = signup.serverId
      ? serverNameById.get(signup.serverId)
      : undefined;

    return [
      {
        id: signup.id,
        characterName,
        serverName,
      },
    ];
  });
};

export const validateRaidLootForm = (values: {
  itemId?: string;
  createName?: string;
  quantity?: number;
}): string | undefined => {
  if (!values.itemId && !values.createName?.trim()) {
    return '请选择物品';
  }

  if (values.quantity === undefined) {
    return '数量须为大于0的整数';
  }

  return undefined;
};
