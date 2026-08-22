import { describe, expect, it } from 'vitest';
import {
  defaultGameItemsSearch,
  gameItemsSearchSchema,
  toListGameItemsFilters,
} from '@/routes/_authenticated/admin/game-items/-lib/game-items-schema';

describe('gameItemsSearchSchema', () => {
  it('trims name and keeps pagination', () => {
    expect(
      gameItemsSearchSchema.parse({
        page: '2',
        pageSize: '10',
        name: '  上品玄晶  ',
        type: 'special',
        quality: 'orange',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      name: '上品玄晶',
      type: 'special',
      quality: 'orange',
    });
  });

  it('keeps missing filters off the parsed search', () => {
    expect(gameItemsSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('exports default search values', () => {
    expect(defaultGameItemsSearch).toEqual({
      page: 1,
      pageSize: 20,
      name: undefined,
      type: undefined,
      quality: undefined,
    });
  });
});

describe('toListGameItemsFilters', () => {
  it('maps search to list filters', () => {
    expect(
      toListGameItemsFilters({
        ...defaultGameItemsSearch,
        name: '玄',
        type: 'small_iron',
        quality: 'purple',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      name: '玄',
      type: 'small_iron',
      quality: 'purple',
    });
  });
});
