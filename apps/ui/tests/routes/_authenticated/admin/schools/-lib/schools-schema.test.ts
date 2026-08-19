import { describe, expect, it } from 'vitest';
import {
  defaultSchoolsSearch,
  schoolsSearchSchema,
  toListSchoolsFilters,
} from '@/routes/_authenticated/admin/schools/-lib/schools-schema';

describe('schoolsSearchSchema', () => {
  it('trims name and keeps pagination', () => {
    expect(
      schoolsSearchSchema.parse({
        page: '2',
        pageSize: '10',
        name: '  纯阳  ',
        type: 'school',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      name: '纯阳',
      type: 'school',
    });
  });

  it('keeps missing filters off the parsed search', () => {
    expect(schoolsSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('exports default search values', () => {
    expect(defaultSchoolsSearch).toEqual({
      page: 1,
      pageSize: 20,
      name: undefined,
      type: undefined,
    });
  });
});

describe('toListSchoolsFilters', () => {
  it('maps search to list filters', () => {
    expect(
      toListSchoolsFilters({
        ...defaultSchoolsSearch,
        name: '纯',
        type: 'genre',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      name: '纯',
      type: 'genre',
    });
  });
});
