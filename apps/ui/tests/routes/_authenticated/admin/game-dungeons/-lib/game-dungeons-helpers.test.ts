import { describe, expect, it } from 'vitest';
import {
  difficultyBadgeClassName,
  difficultyLabel,
  formatResetWeekdays,
  toAdminGameDungeonFormValues,
  weekdayLabel,
} from '@/routes/_authenticated/admin/game-dungeons/-lib/game-dungeons-helpers';

describe('difficulty labels', () => {
  it('maps difficulties', () => {
    expect(difficultyLabel('normal')).toBe('普通');
    expect(difficultyLabel('heroic')).toBe('英雄');
    expect(difficultyLabel('challenge')).toBe('挑战');
  });
});

describe('difficultyBadgeClassName', () => {
  it('maps difficulties', () => {
    expect(difficultyBadgeClassName('normal')).toContain('bg-slate-500');
    expect(difficultyBadgeClassName('heroic')).toContain('bg-amber-500');
    expect(difficultyBadgeClassName('challenge')).toContain('bg-red-500');
  });
});

describe('weekday labels', () => {
  it('maps weekdays and falls back', () => {
    expect(weekdayLabel(1)).toBe('周一');
    expect(weekdayLabel(7)).toBe('周日');
    expect(weekdayLabel(9)).toBe('9');
  });
});

describe('formatResetWeekdays', () => {
  it('returns null for empty days and formats sorted labels', () => {
    expect(formatResetWeekdays([])).toBeNull();
    expect(formatResetWeekdays([4, 1])).toBe('周一、周四');
  });
});

describe('toAdminGameDungeonFormValues', () => {
  it('converts form strings to numbers and sorts weekdays', () => {
    expect(
      toAdminGameDungeonFormValues({
        name: '河阳之战',
        expansionId: 'expansion-1',
        seasonId: 'season-1',
        playerLimit: '25',
        difficulty: 'heroic',
        levelRequirement: '120',
        bossCount: '6',
        resetWeekdays: [4, 1],
      }),
    ).toEqual({
      name: '河阳之战',
      expansionId: 'expansion-1',
      seasonId: 'season-1',
      playerLimit: 25,
      difficulty: 'heroic',
      levelRequirement: 120,
      bossCount: 6,
      resetWeekdays: [1, 4],
    });
  });
});
