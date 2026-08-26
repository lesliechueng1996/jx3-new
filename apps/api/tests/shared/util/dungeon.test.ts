import { describe, expect, it } from 'bun:test';
import { formatDungeonDisplayName } from '@api/shared/util/dungeon';

describe('formatDungeonDisplayName', () => {
  it('joins player limit, difficulty, and name', () => {
    expect(formatDungeonDisplayName('河阳之战', 25, 'heroic')).toBe(
      '25人英雄河阳之战',
    );
    expect(formatDungeonDisplayName('一之窟', 10, 'normal')).toBe(
      '10人普通一之窟',
    );
    expect(formatDungeonDisplayName('一之窟', 10, 'challenge')).toBe(
      '10人挑战一之窟',
    );
  });

  it('returns null when any part is missing', () => {
    expect(formatDungeonDisplayName(null, 25, 'heroic')).toBeNull();
    expect(formatDungeonDisplayName('', 25, 'heroic')).toBeNull();
    expect(formatDungeonDisplayName('河阳之战', null, 'heroic')).toBeNull();
    expect(formatDungeonDisplayName('河阳之战', 25, null)).toBeNull();
  });
});
