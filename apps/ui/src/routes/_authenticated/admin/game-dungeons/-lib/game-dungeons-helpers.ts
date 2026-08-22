import type {
  AdminGameDungeonFormValues,
  DungeonDifficulty,
} from '@/lib/api/admin/admin-game-dungeons-api';
import type { GameDungeonFormValues } from './game-dungeons-form-schema';

export const WEEKDAY_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: 'normal', label: '普通' },
  { value: 'heroic', label: '英雄' },
  { value: 'challenge', label: '挑战' },
] as const;

export const difficultyLabel = (difficulty: DungeonDifficulty): string => {
  if (difficulty === 'heroic') {
    return '英雄';
  }
  if (difficulty === 'challenge') {
    return '挑战';
  }
  return '普通';
};

export const difficultyBadgeClassName = (
  difficulty: DungeonDifficulty,
): string => {
  if (difficulty === 'heroic') {
    return 'border-transparent bg-amber-500 text-white';
  }
  if (difficulty === 'challenge') {
    return 'border-transparent bg-red-500 text-white';
  }
  return 'border-transparent bg-slate-500 text-white';
};

export const weekdayLabel = (day: number): string => {
  const option = WEEKDAY_OPTIONS.find((item) => item.value === day);
  return option?.label ?? String(day);
};

export const formatResetWeekdays = (days: number[]): string | null => {
  if (days.length === 0) {
    return null;
  }

  return [...days]
    .sort((left, right) => left - right)
    .map(weekdayLabel)
    .join('、');
};

export const toAdminGameDungeonFormValues = (
  values: GameDungeonFormValues,
): AdminGameDungeonFormValues => ({
  name: values.name,
  expansionId: values.expansionId,
  seasonId: values.seasonId,
  playerLimit: Number(values.playerLimit),
  difficulty: values.difficulty,
  levelRequirement: Number(values.levelRequirement),
  bossCount: Number(values.bossCount),
  resetWeekdays: [...values.resetWeekdays].sort((left, right) => left - right),
});
