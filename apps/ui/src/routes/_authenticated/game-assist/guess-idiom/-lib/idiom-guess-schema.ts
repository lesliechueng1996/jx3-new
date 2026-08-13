import type { SearchIdiomsResponseSchema } from '#/lib/api/admin/idiom-guess-api';

export type GuessCellColor = 'black' | 'orange' | 'green';

export const DEFAULT_CELL_COLOR: GuessCellColor = 'black';

export type GuessCellState = {
  position: number;
  char: string;
  pinyin: string;
  initial: string;
  final: string;
  tone: number;
  charColor: GuessCellColor;
  initialColor: GuessCellColor;
  finalColor: GuessCellColor;
  toneColor: GuessCellColor;
  syllableLink: GuessCellColor;
};

export type GuessRoundState = {
  id: string;
  text: string;
  inDatabase: boolean;
  cells: GuessCellState[];
};

export type IdiomGuessResult = SearchIdiomsResponseSchema;
