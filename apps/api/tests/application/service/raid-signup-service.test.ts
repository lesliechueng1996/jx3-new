import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { RaidSignupSearchItem } from '@api/interface/schema/raid-signup-schema';

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

const searchByCharacterName = mock<
  (name: string, limit: number) => Promise<ReturnType<typeof searchRow>[]>
>(() => Promise.resolve([]));

mock.module('@api/infrastructure/repository/raid-signup-repository', () => ({
  raidSignupRepository: {
    searchByCharacterName,
  },
}));

const { searchRaidSignups } = await import(
  '@api/application/service/raid-signup-service'
);

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
