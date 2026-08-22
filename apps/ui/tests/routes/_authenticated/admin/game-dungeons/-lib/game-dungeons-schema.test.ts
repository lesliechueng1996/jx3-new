import { describe, expect, it } from 'vitest';
import {
  defaultGameDungeonsSearch,
  gameDungeonsSearchSchema,
  toListGameDungeonsFilters,
} from '@/routes/_authenticated/admin/game-dungeons/-lib/game-dungeons-schema';

describe('gameDungeonsSearchSchema', () => {
  it('trims name and keeps pagination', () => {
    expect(
      gameDungeonsSearchSchema.parse({
        page: '2',
        pageSize: '10',
        name: '  河阳之战  ',
        expansionId: ' expansion-1 ',
        seasonId: ' season-1 ',
        difficulty: 'heroic',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      name: '河阳之战',
      expansionId: 'expansion-1',
      seasonId: 'season-1',
      difficulty: 'heroic',
    });
  });

  it('keeps missing filters off the parsed search', () => {
    expect(gameDungeonsSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('clears blank ids', () => {
    expect(
      gameDungeonsSearchSchema.parse({ expansionId: '  ' }).expansionId,
    ).toBe(undefined);
    expect(gameDungeonsSearchSchema.parse({ seasonId: '  ' }).seasonId).toBe(
      undefined,
    );
  });

  it('exports default search values', () => {
    expect(defaultGameDungeonsSearch).toEqual({
      page: 1,
      pageSize: 20,
      name: undefined,
      expansionId: undefined,
      seasonId: undefined,
      difficulty: undefined,
    });
  });
});

describe('toListGameDungeonsFilters', () => {
  it('maps search to list filters', () => {
    expect(
      toListGameDungeonsFilters({
        ...defaultGameDungeonsSearch,
        name: '河',
        expansionId: 'expansion-1',
        seasonId: 'season-1',
        difficulty: 'challenge',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      name: '河',
      expansionId: 'expansion-1',
      seasonId: 'season-1',
      difficulty: 'challenge',
    });
  });
});
