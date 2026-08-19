import { describe, expect, it } from 'vitest';
import {
  defaultUsersSearch,
  toListUsersFilters,
  usersSearchSchema,
} from '@/routes/_authenticated/admin/users/-lib/users-schema';

describe('usersSearchSchema', () => {
  it('trims name and email and keeps pagination', () => {
    expect(
      usersSearchSchema.parse({
        page: '2',
        pageSize: '10',
        name: '  ali  ',
        email: '  a@  ',
        role: 'admin',
        banned: 'true',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      name: 'ali',
      email: 'a@',
      role: 'admin',
      banned: 'true',
    });
  });

  it('keeps missing filters off the parsed search', () => {
    expect(usersSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('exports default search values', () => {
    expect(defaultUsersSearch).toEqual({
      page: 1,
      pageSize: 20,
      name: undefined,
      email: undefined,
      role: undefined,
      banned: undefined,
    });
  });
});

describe('toListUsersFilters', () => {
  it('maps banned true and false from search strings', () => {
    expect(
      toListUsersFilters({
        ...defaultUsersSearch,
        banned: 'true',
      }).banned,
    ).toBe(true);
    expect(
      toListUsersFilters({
        ...defaultUsersSearch,
        banned: 'false',
      }).banned,
    ).toBe(false);
    expect(toListUsersFilters(defaultUsersSearch).banned).toBeUndefined();
  });
});
