import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_CONFIG,
  cellPositionKey,
  HERO_CONFIG,
  PRESET_CONFIGS,
  parseCellPositionKey,
  parsePositiveInt,
  validateCustomConfig,
} from '@/routes/_authenticated/game-assist/minesweeper/-lib/minesweeper-setup';

describe('minesweeper-setup', () => {
  it('round-trips cell position keys', () => {
    expect(cellPositionKey(2, 4)).toBe('2-4');
    expect(parseCellPositionKey('2-4')).toEqual({ row: 2, column: 4 });
    expect(parseCellPositionKey('a-1')).toBeNull();
  });

  it('parses positive integers only', () => {
    expect(parsePositiveInt('12')).toBe(12);
    expect(parsePositiveInt(' 3 ')).toBe(3);
    expect(parsePositiveInt('01')).toBe(1);
    expect(parsePositiveInt('-1')).toBeNull();
    expect(parsePositiveInt('1.5')).toBeNull();
  });

  it('exposes preset configs', () => {
    expect(PRESET_CONFIGS.challenge).toEqual(CHALLENGE_CONFIG);
    expect(PRESET_CONFIGS.hero).toEqual(HERO_CONFIG);
  });

  it('validates custom board limits', () => {
    expect(validateCustomConfig('2', '2', '1')).toEqual({
      config: { rows: 2, columns: 2, mines: 1 },
    });
    expect(validateCustomConfig('0', '2', '1')).toEqual({
      error: '行数需要是 1–20 的整数',
    });
    expect(validateCustomConfig('2', '0', '1')).toEqual({
      error: '列数需要是 1–30 的整数',
    });
    expect(validateCustomConfig('2', '2', '0')).toEqual({
      error: '雷数需要是 1–200 的整数',
    });
    expect(validateCustomConfig('2', '2', '4')).toEqual({
      error: '雷数必须小于格子总数',
    });
    const tooManyRows = validateCustomConfig('21', '2', '1');
    const tooManyColumns = validateCustomConfig('2', '31', '1');
    const tooManyMines = validateCustomConfig('2', '2', '201');
    if (
      !('error' in tooManyRows) ||
      !('error' in tooManyColumns) ||
      !('error' in tooManyMines)
    ) {
      throw new Error('expected custom config validation errors');
    }
    expect(tooManyRows.error).toMatch(/行数/);
    expect(tooManyColumns.error).toMatch(/列数/);
    expect(tooManyMines.error).toMatch(/雷数/);
  });
});
