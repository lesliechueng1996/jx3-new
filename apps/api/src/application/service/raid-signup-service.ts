import { raidSignupRepository } from '@api/infrastructure/repository/raid-signup-repository';
import type {
  ListRaidSignupsQuery,
  RaidSignupFlag,
  RaidSignupListItem,
  RaidSignupSearchItem,
} from '@api/interface/schema/raid-signup-schema';
import { formatDateTimeToMinute } from '@api/shared/util/date';
import { formatDungeonDisplayName } from '@api/shared/util/dungeon';

const RAID_SIGNUP_SEARCH_LIMIT = 10;

type RaidSignupSearchRow = Awaited<
  ReturnType<typeof raidSignupRepository.searchByCharacterName>
>[number];

type RaidSignupListRow = Awaited<
  ReturnType<typeof raidSignupRepository.listPagination>
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

export const normalizeRaidSignupFlags = (
  flags: ListRaidSignupsQuery['flags'],
): RaidSignupFlag[] | undefined => {
  if (flags === undefined) {
    return undefined;
  }

  const list = Array.isArray(flags) ? flags : [flags];
  const unique = [...new Set(list)];
  return unique.length === 0 ? undefined : unique;
};

const toRaidSignupListItem = (row: RaidSignupListRow): RaidSignupListItem => ({
  id: row.id,
  raidRunId: row.raidRunId,
  raidRunName: row.raidRunName,
  startTime: row.startTime ? formatDateTimeToMinute(row.startTime) : null,
  dungeonName: formatDungeonDisplayName(
    row.dungeonName,
    row.dungeonPlayerLimit,
    row.dungeonDifficulty,
  ),
  role: row.role,
  status: row.status,
  isReserved: row.isReserved,
  isLeader: row.isLeader,
  isDarkRun: row.isDarkRun,
  isFormationCore: row.isFormationCore,
  characterName: row.characterName ?? '',
  serverName: row.serverName,
  kungfuName: row.kungfuName,
  createdAt: formatDateTimeToMinute(row.createdAt),
});

export const listAdminRaidSignups = async (
  query: ListRaidSignupsQuery,
): Promise<{
  items: RaidSignupListItem[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const normalizedQuery = {
    ...query,
    flags: normalizeRaidSignupFlags(query.flags),
  };
  const where = raidSignupRepository.buildWhereClause(normalizedQuery);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    raidSignupRepository.listPagination(where, query.pageSize, offset),
    raidSignupRepository.count(where),
  ]);

  return {
    items: rows.map(toRaidSignupListItem),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};
