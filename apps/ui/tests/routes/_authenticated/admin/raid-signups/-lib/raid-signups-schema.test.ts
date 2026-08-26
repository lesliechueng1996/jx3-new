import { describe, expect, it } from 'vitest';
import {
  defaultRaidSignupsSearch,
  raidSignupsSearchSchema,
  toListRaidSignupsFilters,
} from '@/routes/_authenticated/admin/raid-signups/-lib/raid-signups-schema';

describe('raidSignupsSearchSchema', () => {
  it('trims text filters and keeps pagination', () => {
    expect(
      raidSignupsSearchSchema.parse({
        page: '2',
        pageSize: '10',
        characterName: '  少侠  ',
        raidRunName: '  周六团  ',
        serverId: '  server-1  ',
        kungfuId: '  kungfu-1  ',
        role: 'dps',
        flags: ['leader', 'leader', 'darkRun'],
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      characterName: '少侠',
      raidRunName: '周六团',
      serverId: 'server-1',
      kungfuId: 'kungfu-1',
      role: 'dps',
      flags: ['leader', 'darkRun'],
    });
  });

  it('wraps a single flag and drops empty values', () => {
    expect(
      raidSignupsSearchSchema.parse({
        characterName: '   ',
        raidRunName: '',
        serverId: '',
        kungfuId: '',
        flags: 'reserved',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      flags: ['reserved'],
    });
  });

  it('drops empty flag lists', () => {
    expect(raidSignupsSearchSchema.parse({ flags: [] })).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('keeps missing filters off the parsed search', () => {
    expect(raidSignupsSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('exports default search values', () => {
    expect(defaultRaidSignupsSearch).toEqual({
      page: 1,
      pageSize: 20,
      characterName: undefined,
      raidRunName: undefined,
      serverId: undefined,
      kungfuId: undefined,
      role: undefined,
      flags: undefined,
    });
  });
});

describe('toListRaidSignupsFilters', () => {
  it('maps search to list filters', () => {
    expect(
      toListRaidSignupsFilters({
        ...defaultRaidSignupsSearch,
        characterName: '少侠',
        raidRunName: '周六',
        serverId: 'server-1',
        kungfuId: 'kungfu-1',
        role: 'tank',
        flags: ['leader'],
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      characterName: '少侠',
      raidRunName: '周六',
      serverId: 'server-1',
      kungfuId: 'kungfu-1',
      role: 'tank',
      flags: ['leader'],
    });
  });
});
