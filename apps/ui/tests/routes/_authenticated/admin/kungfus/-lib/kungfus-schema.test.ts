import { describe, expect, it } from 'vitest';
import {
  defaultKungfusSearch,
  kungfusSearchSchema,
  toListKungfusFilters,
} from '@/routes/_authenticated/admin/kungfus/-lib/kungfus-schema';

describe('kungfusSearchSchema', () => {
  it('trims name and keeps pagination', () => {
    expect(
      kungfusSearchSchema.parse({
        page: '2',
        pageSize: '10',
        name: '  紫霞功  ',
        schoolId: ' school-1 ',
        kungfuType: 'attack',
        isUnlimited: 'true',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      name: '紫霞功',
      schoolId: 'school-1',
      kungfuType: 'attack',
      isUnlimited: 'true',
    });
  });

  it('keeps missing filters off the parsed search', () => {
    expect(kungfusSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('clears blank school ids', () => {
    expect(kungfusSearchSchema.parse({ schoolId: '  ' }).schoolId).toBe(
      undefined,
    );
  });

  it('exports default search values', () => {
    expect(defaultKungfusSearch).toEqual({
      page: 1,
      pageSize: 20,
      name: undefined,
      schoolId: undefined,
      kungfuType: undefined,
      isUnlimited: undefined,
    });
  });
});

describe('toListKungfusFilters', () => {
  it('maps search to list filters', () => {
    expect(
      toListKungfusFilters({
        ...defaultKungfusSearch,
        name: '紫',
        schoolId: 'school-1',
        kungfuType: 'heal',
        isUnlimited: 'true',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      name: '紫',
      schoolId: 'school-1',
      kungfuType: 'heal',
      isUnlimited: true,
    });
  });

  it('maps a false unlimited filter', () => {
    expect(
      toListKungfusFilters({
        ...defaultKungfusSearch,
        isUnlimited: 'false',
      }).isUnlimited,
    ).toBe(false);
  });
});
