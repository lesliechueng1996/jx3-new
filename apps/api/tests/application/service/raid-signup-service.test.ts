import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  ListRaidSignupsQuery,
  RaidSignupSearchItem,
} from '@api/interface/schema/raid-signup-schema';

const searchRow = (
  overrides: Partial<{
    id: string;
    characterName: string | null;
    serverId: string | null;
    serverName: string | null;
    kungfuId: string | null;
    kungfuName: string | null;
    schoolId: string | null;
    kungfuType: 'defense' | 'heal' | 'attack' | null;
  }> = {},
) => ({
  id: 'signup-1',
  characterName: '少侠甲',
  serverId: 'server-1',
  serverName: '梦江南',
  kungfuId: 'kungfu-1',
  kungfuName: '紫霞功',
  schoolId: 'school-1',
  kungfuType: 'attack' as const,
  ...overrides,
});

type ListRow = {
  id: string;
  raidRunId: string;
  raidRunName: string | null;
  startTime: Date | null;
  dungeonName: string | null;
  dungeonPlayerLimit: number | null;
  dungeonDifficulty: 'normal' | 'heroic' | 'challenge' | null;
  role: 'pending' | 'tank' | 'healer' | 'dps' | 'boss';
  status: 'pending' | 'confirmed' | 'waitlist' | 'rejected';
  isReserved: boolean;
  isLeader: boolean;
  isDarkRun: boolean;
  isFormationCore: boolean;
  characterName: string | null;
  serverName: string | null;
  kungfuName: string | null;
  createdAt: Date;
};

const listRow = (overrides: Partial<ListRow> = {}): ListRow => ({
  id: 'signup-1',
  raidRunId: 'raid-run-1',
  raidRunName: '周六团',
  startTime: new Date('2026-08-22T13:00:00.000Z'),
  dungeonName: '河阳之战',
  dungeonPlayerLimit: 25,
  dungeonDifficulty: 'heroic',
  role: 'dps',
  status: 'confirmed',
  isReserved: false,
  isLeader: true,
  isDarkRun: false,
  isFormationCore: false,
  characterName: '少侠甲',
  serverName: '梦江南',
  kungfuName: '紫霞功',
  createdAt: new Date('2026-08-22T13:00:00.000Z'),
  ...overrides,
});

const searchByCharacterName = mock<
  (name: string, limit: number) => Promise<ReturnType<typeof searchRow>[]>
>(() => Promise.resolve([]));
const buildWhereClause = mock((_query: unknown) => undefined as unknown);
const listPagination = mock(
  async (_where: unknown, _limit: number, _offset: number) => [] as ListRow[],
);
const count = mock(
  async (_where: unknown) => [{ total: 0 }] as Array<{ total: number }>,
);
const formatDateTimeToMinute = mock(
  (date: Date) => `min:${date.toISOString()}`,
);

mock.module('@api/infrastructure/repository/raid-signup-repository', () => ({
  raidSignupRepository: {
    searchByCharacterName,
    buildWhereClause,
    listPagination,
    count,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTimeToMinute,
}));

const { listAdminRaidSignups, normalizeRaidSignupFlags, searchRaidSignups } =
  await import('@api/application/service/raid-signup-service');

describe('searchRaidSignups', () => {
  beforeEach(() => {
    searchByCharacterName.mockReset();
    searchByCharacterName.mockResolvedValue([]);
  });

  it('trims the name and limits results to 10', async () => {
    const row = searchRow();
    searchByCharacterName.mockResolvedValue([row]);

    const result = await searchRaidSignups('  少侠  ');

    expect(searchByCharacterName).toHaveBeenCalledWith('少侠', 10);
    expect(result).toEqual([row as RaidSignupSearchItem]);
  });

  it('returns an empty list when the search name is blank', async () => {
    await expect(searchRaidSignups('   ')).resolves.toEqual([]);
    expect(searchByCharacterName).not.toHaveBeenCalled();
  });

  it('skips rows without a character name', async () => {
    searchByCharacterName.mockResolvedValue([
      searchRow({ characterName: null }),
      searchRow({ id: 'signup-2', characterName: '少侠乙' }),
    ]);

    await expect(searchRaidSignups('少侠')).resolves.toEqual([
      {
        id: 'signup-2',
        characterName: '少侠乙',
        serverId: 'server-1',
        serverName: '梦江南',
        kungfuId: 'kungfu-1',
        kungfuName: '紫霞功',
        schoolId: 'school-1',
        kungfuType: 'attack',
      },
    ]);
  });
});

describe('normalizeRaidSignupFlags', () => {
  it('returns undefined for missing or empty flags', () => {
    expect(normalizeRaidSignupFlags(undefined)).toBeUndefined();
    expect(normalizeRaidSignupFlags([])).toBeUndefined();
  });

  it('wraps a single flag and dedupes arrays', () => {
    expect(normalizeRaidSignupFlags('leader')).toEqual(['leader']);
    expect(normalizeRaidSignupFlags(['leader', 'darkRun', 'leader'])).toEqual([
      'leader',
      'darkRun',
    ]);
  });
});

describe('listAdminRaidSignups', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    listPagination.mockReset();
    count.mockReset();
    formatDateTimeToMinute.mockClear();
    buildWhereClause.mockReturnValue(undefined);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
  });

  it('lists signups and maps rows', async () => {
    listPagination.mockResolvedValue([listRow()]);
    count.mockResolvedValue([{ total: 1 }]);

    const query: ListRaidSignupsQuery = {
      page: 2,
      pageSize: 10,
      characterName: '少侠',
      raidRunName: '周六',
      role: 'dps',
      flags: ['leader', 'darkRun'],
    };
    const result = await listAdminRaidSignups(query);

    expect(buildWhereClause).toHaveBeenCalledWith({
      ...query,
      flags: ['leader', 'darkRun'],
    });
    expect(listPagination).toHaveBeenCalledWith(undefined, 10, 10);
    expect(result).toEqual({
      items: [
        {
          id: 'signup-1',
          raidRunId: 'raid-run-1',
          raidRunName: '周六团',
          startTime: 'min:2026-08-22T13:00:00.000Z',
          dungeonName: '25人英雄河阳之战',
          role: 'dps',
          status: 'confirmed',
          isReserved: false,
          isLeader: true,
          isDarkRun: false,
          isFormationCore: false,
          characterName: '少侠甲',
          serverName: '梦江南',
          kungfuName: '紫霞功',
          createdAt: 'min:2026-08-22T13:00:00.000Z',
        },
      ],
      total: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it('normalizes a single flag and defaults total to 0', async () => {
    listPagination.mockResolvedValue([
      listRow({
        raidRunName: null,
        startTime: null,
        dungeonName: null,
        dungeonPlayerLimit: null,
        dungeonDifficulty: null,
        characterName: null,
        serverName: null,
        kungfuName: null,
      }),
    ]);
    count.mockResolvedValue([]);

    const result = await listAdminRaidSignups({
      page: 1,
      pageSize: 20,
      flags: 'reserved',
    });

    expect(buildWhereClause).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      flags: ['reserved'],
    });
    expect(result.total).toBe(0);
    expect(result.items[0]).toMatchObject({
      raidRunName: null,
      startTime: null,
      dungeonName: null,
      characterName: '',
      serverName: null,
      kungfuName: null,
    });
  });

  it('formats dungeon names for each difficulty', async () => {
    listPagination.mockResolvedValue([
      listRow({ dungeonDifficulty: 'normal' }),
      listRow({
        id: 'signup-2',
        dungeonName: '一之窟',
        dungeonPlayerLimit: 10,
        dungeonDifficulty: 'challenge',
      }),
    ]);
    count.mockResolvedValue([{ total: 2 }]);

    const result = await listAdminRaidSignups({ page: 1, pageSize: 20 });

    expect(result.items.map((item) => item.dungeonName)).toEqual([
      '25人普通河阳之战',
      '10人挑战一之窟',
    ]);
  });
});
