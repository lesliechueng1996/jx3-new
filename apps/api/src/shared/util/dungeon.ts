import type { DungeonDifficulty } from '@api/interface/schema/game-dungeon-schema';

const DUNGEON_DIFFICULTY_LABEL: Record<DungeonDifficulty, string> = {
  normal: '普通',
  heroic: '英雄',
  challenge: '挑战',
};

export const formatDungeonDisplayName = (
  name: string | null,
  playerLimit: number | null,
  difficulty: DungeonDifficulty | null,
): string | null => {
  if (!name || playerLimit === null || !difficulty) {
    return null;
  }

  return `${playerLimit}人${DUNGEON_DIFFICULTY_LABEL[difficulty]}${name}`;
};
