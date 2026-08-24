import { raidSignupRepository } from '@api/infrastructure/repository/raid-signup-repository';
import type { RaidSignupSearchItem } from '@api/interface/schema/raid-signup-schema';

const RAID_SIGNUP_SEARCH_LIMIT = 10;

type RaidSignupSearchRow = Awaited<
  ReturnType<typeof raidSignupRepository.searchByCharacterName>
>[number];

const toRaidSignupSearchItem = (
  row: RaidSignupSearchRow,
): RaidSignupSearchItem | undefined => {
  if (!row.characterName) {
    return undefined;
  }

  return {
    id: row.id,
    characterName: row.characterName,
    serverId: row.serverId,
    serverName: row.serverName,
    kungfuId: row.kungfuId,
    kungfuName: row.kungfuName,
    schoolId: row.schoolId,
    kungfuType: row.kungfuType,
  };
};

export const searchRaidSignups = async (
  name: string,
): Promise<RaidSignupSearchItem[]> => {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const rows = await raidSignupRepository.searchByCharacterName(
    trimmed,
    RAID_SIGNUP_SEARCH_LIMIT,
  );

  return rows.flatMap((row) => {
    const item = toRaidSignupSearchItem(row);
    return item ? [item] : [];
  });
};
