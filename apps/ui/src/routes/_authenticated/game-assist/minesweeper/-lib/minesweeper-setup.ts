export type DifficultyMode = 'challenge' | 'hero' | 'custom';

export type MinesweeperConfig = {
  rows: number;
  columns: number;
  mines: number;
};

export const CHALLENGE_CONFIG: MinesweeperConfig = {
  rows: 14,
  columns: 14,
  mines: 80,
};

export const HERO_CONFIG: MinesweeperConfig = {
  rows: 12,
  columns: 12,
  mines: 42,
};

export const PRESET_CONFIGS: Record<
  Exclude<DifficultyMode, 'custom'>,
  MinesweeperConfig
> = {
  challenge: CHALLENGE_CONFIG,
  hero: HERO_CONFIG,
};

export const MAX_ROWS = 20;
export const MAX_COLUMNS = 30;
export const MAX_MINES = 200;

export function cellPositionKey(row: number, column: number): string {
  return `${row}-${column}`;
}

export function parseCellPositionKey(
  key: string,
): { row: number; column: number } | null {
  const [rowText, columnText] = key.split('-');
  const row = Number(rowText);
  const column = Number(columnText);
  if (!Number.isInteger(row) || !Number.isInteger(column)) {
    return null;
  }
  return { row, column };
}

export function parsePositiveInt(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

export function validateCustomConfig(
  rowsValue: string,
  columnsValue: string,
  minesValue: string,
): { config: MinesweeperConfig } | { error: string } {
  const rows = parsePositiveInt(rowsValue);
  const columns = parsePositiveInt(columnsValue);
  const mines = parsePositiveInt(minesValue);

  if (rows === null || rows < 1 || rows > MAX_ROWS) {
    return { error: `行数需要是 1–${MAX_ROWS} 的整数` };
  }
  if (columns === null || columns < 1 || columns > MAX_COLUMNS) {
    return { error: `列数需要是 1–${MAX_COLUMNS} 的整数` };
  }
  if (mines === null || mines < 1 || mines > MAX_MINES) {
    return { error: `雷数需要是 1–${MAX_MINES} 的整数` };
  }
  if (mines >= rows * columns) {
    return { error: '雷数必须小于格子总数' };
  }

  return { config: { rows, columns, mines } };
}
