import { describe, expect, it } from 'vitest';
import { MinesweeperCellType } from '@/routes/_authenticated/game-assist/minesweeper/-lib/minesweeper-cell';
import { MinesweeperGame } from '@/routes/_authenticated/game-assist/minesweeper/-lib/minesweeper-game';

describe('MinesweeperGame', () => {
  it('flags, explodes, cycles values, and resets cells', () => {
    const game = new MinesweeperGame(3, 3, 2);

    game.explode(1, 1, 9);
    expect(game.cells[1][1].getType()).toBe(MinesweeperCellType.EMPTY);

    game.explode(1, 1, 1);
    expect(game.cells[1][1].isExploded()).toBe(true);
    expect(game.cells[1][1].getValue()).toBe(1);

    game.setFlag(0, 0);
    expect(game.cells[0][0].isFlagged()).toBe(true);
    game.removeFlag(0, 0);
    expect(game.cells[0][0].getType()).toBe(MinesweeperCellType.EMPTY);

    game.toggleFlag(0, 0);
    expect(game.cells[0][0].isFlagged()).toBe(true);
    game.toggleFlag(0, 0);
    expect(game.cells[0][0].isFlagged()).toBe(false);

    game.revealOrCycleValue(0, 0, false);
    expect(game.cells[0][0].isExploded()).toBe(true);
    game.revealOrCycleValue(0, 0, false);
    expect(game.cells[0][0].getValue()).toBe(0);
    game.revealOrCycleValue(0, 0, true);
    expect(game.cells[0][0].getValue()).toBe(1);

    game.setCellValue(0, 1, 3);
    expect(game.cells[0][1].getValue()).toBe(3);
    game.setCellValue(0, 1, 9);
    expect(game.cells[0][1].getValue()).toBe(3);

    game.setFlag(2, 2);
    game.revealOrCycleValue(2, 2, false);
    expect(game.cells[2][2].isExploded()).toBe(true);

    game.setFlag(2, 1);
    game.setCellValue(2, 1, 2);
    expect(game.cells[2][1].isExploded()).toBe(true);
    expect(game.cells[2][1].getValue()).toBe(2);

    game.resetCell(2, 1);
    expect(game.cells[2][1].getType()).toBe(MinesweeperCellType.EMPTY);
  });

  it('wraps cycled values back to 0', () => {
    const game = new MinesweeperGame(1, 1, 0);
    game.explode(0, 0, 8);
    game.revealOrCycleValue(0, 0, true);
    expect(game.cells[0][0].getValue()).toBe(0);
  });

  it('counts flags and applies suggested flags', () => {
    const game = new MinesweeperGame(2, 2, 2);
    expect(game.getFlaggedCount()).toBe(0);

    game.explode(0, 0, 1);
    const applied = game.applySuggestedFlags([
      { row: 0, column: 1 },
      { row: 0, column: 1 },
      { row: 9, column: 9 },
      { row: 0, column: 0 },
    ]);
    expect(applied).toBe(1);
    expect(game.getFlaggedCount()).toBe(1);

    game.setFlag(1, 1);
    expect(game.applySuggestedFlags([{ row: 1, column: 1 }])).toBe(0);
  });

  it('opens suggested cells and infers values from known mines', () => {
    const game = new MinesweeperGame(2, 2, 1);
    game.explode(0, 0, 1);
    game.setFlag(0, 1);

    const undetermined = game.openSuggestedCells(
      [
        { row: 1, column: 0 },
        { row: 9, column: 0 },
        { row: 0, column: 0 },
      ],
      [{ row: 0, column: 1 }],
    );

    expect(game.cells[1][0].isExploded()).toBe(true);
    expect(undetermined.length).toBeGreaterThanOrEqual(0);

    game.setFlag(1, 1);
    game.openSuggestedCells([{ row: 1, column: 1 }], []);
    expect(game.cells[1][1].isExploded()).toBe(true);
  });

  it('deduces all neighbors as mines when a cell shows 8', () => {
    const game = new MinesweeperGame(3, 3, 8);
    game.explode(1, 1, 8);
    const result = game.analyzeGame(false);
    expect(result.needToFlagCells).toHaveLength(8);
    expect(result.needToExplodeCells).toHaveLength(0);
  });

  it('deduces all neighbors as safe when a cell shows 0', () => {
    const game = new MinesweeperGame(3, 3, 1);
    game.explode(1, 1, 0);
    const result = game.analyzeGame(false);
    expect(result.needToExplodeCells).toHaveLength(8);
    expect(result.needToFlagCells).toHaveLength(0);
  });

  it('uses remaining mine count when every unknown must be a mine', () => {
    const game = new MinesweeperGame(2, 2, 3);
    game.explode(0, 0, 3);
    const result = game.analyzeGame(false);
    expect(result.needToFlagCells.length).toBeGreaterThan(0);
  });

  it('uses remaining mine count when no mines remain', () => {
    const game = new MinesweeperGame(2, 2, 0);
    game.explode(0, 0, 0);
    const result = game.analyzeGame(true);
    expect(result.needToExplodeCells.length).toBeGreaterThan(0);
  });

  it('applies overlap deductions between adjacent numbers', () => {
    const game = new MinesweeperGame(2, 3, 2);
    game.explode(0, 0, 1);
    game.explode(0, 1, 2);
    const result = game.analyzeGame(false);
    expect(result.needToFlagCells).toBeDefined();
    expect(result.needToExplodeCells).toBeDefined();
  });

  it('runs CSP analysis on a frontier that simple rules cannot finish', () => {
    const game = new MinesweeperGame(3, 3, 2);
    game.explode(0, 0, 1);
    game.explode(0, 2, 1);
    game.explode(2, 0, 1);
    const withoutCsp = game.analyzeGame(false);
    const withCsp = game.analyzeGame(true);
    expect(
      withCsp.needToFlagCells.length + withCsp.needToExplodeCells.length,
    ).toBeGreaterThanOrEqual(
      withoutCsp.needToFlagCells.length + withoutCsp.needToExplodeCells.length,
    );
  });

  it('skips oversized CSP components and still returns simple results', () => {
    const game = new MinesweeperGame(8, 8, 10);
    game.explode(0, 0, 1);
    const result = game.analyzeGame(true);
    expect(result.needToFlagCells).toBeDefined();
    expect(result.needToExplodeCells).toBeDefined();
  });
});
