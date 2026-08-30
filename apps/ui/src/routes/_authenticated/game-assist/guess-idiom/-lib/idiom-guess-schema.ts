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

export const RECOMMENDED_GUESSES = ['漏网之鱼', '卧薪尝胆'] as const;

export const resetCellColors = (cell: GuessCellState): GuessCellState => ({
  ...cell,
  charColor: DEFAULT_CELL_COLOR,
  initialColor: DEFAULT_CELL_COLOR,
  finalColor: DEFAULT_CELL_COLOR,
  toneColor: DEFAULT_CELL_COLOR,
  syllableLink: DEFAULT_CELL_COLOR,
});

export const resetRoundColors = (round: GuessRoundState): GuessRoundState => ({
  ...round,
  cells: round.cells.map(resetCellColors),
});
