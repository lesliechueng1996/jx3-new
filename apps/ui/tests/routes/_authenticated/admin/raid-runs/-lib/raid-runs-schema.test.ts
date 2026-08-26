import { describe, expect, it } from 'vitest';
import {
  defaultRaidRunsSearch,
  raidRunsSearchSchema,
  toListRaidRunsFilters,
} from '@/routes/_authenticated/admin/raid-runs/-lib/raid-runs-schema';

describe('raidRunsSearchSchema', () => {
  it('trims name and keeps pagination', () => {
    expect(
      raidRunsSearchSchema.parse({
        page: '2',
        pageSize: '10',
        name: '  周六团  ',
        status: 'pending',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      name: '周六团',
      status: 'pending',
    });
  });

  it('keeps missing filters off the parsed search', () => {
    expect(raidRunsSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('exports default search values', () => {
    expect(defaultRaidRunsSearch).toEqual({
      page: 1,
      pageSize: 20,
      name: undefined,
      status: undefined,
    });
  });
});

describe('toListRaidRunsFilters', () => {
  it('maps search to list filters', () => {
    expect(
      toListRaidRunsFilters({
        ...defaultRaidRunsSearch,
        name: '周六',
        status: 'recruiting',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      name: '周六',
      status: 'recruiting',
    });
  });
});
