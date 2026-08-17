import { describe, expect, it } from 'vitest';
import {
  MinesweeperCell,
  MinesweeperCellType,
} from '@/routes/_authenticated/game-assist/minesweeper/-lib/minesweeper-cell';

describe('MinesweeperCell', () => {
  it('creates an empty cell and flags it', () => {
    const cell = MinesweeperCell.createEmptyCell(1, 2);
    expect(cell.getType()).toBe(MinesweeperCellType.EMPTY);
    expect(cell.getRow()).toBe(1);
    expect(cell.getColumn()).toBe(2);
    expect(cell.getValue()).toBe(0);
    expect(cell.isFlagged()).toBe(false);

    cell.setFlag();
    expect(cell.isFlagged()).toBe(true);
    cell.removeFlag();
    expect(cell.getType()).toBe(MinesweeperCellType.EMPTY);

    cell.removeFlag();
    expect(cell.getType()).toBe(MinesweeperCellType.EMPTY);
  });

  it('explodes only from empty and ignores invalid values until exploded', () => {
    const cell = MinesweeperCell.createEmptyCell(0, 0);
    cell.setValue(3);
    expect(cell.getValue()).toBe(0);

    cell.explode(2);
    expect(cell.isExploded()).toBe(true);
    expect(cell.getValue()).toBe(2);

    cell.explode(4);
    expect(cell.getValue()).toBe(2);

    cell.setValue(9);
    expect(cell.getValue()).toBe(2);
    cell.setValue(-1);
    expect(cell.getValue()).toBe(2);
    cell.setValue(5);
    expect(cell.getValue()).toBe(5);

    cell.resetToEmpty();
    expect(cell.getType()).toBe(MinesweeperCellType.EMPTY);
    expect(cell.getValue()).toBe(0);
  });

  it('lists in-bound neighbors and formats labels', () => {
    const corner = MinesweeperCell.createEmptyCell(0, 0);
    expect(corner.getNeighborPositions(3, 3)).toEqual([
      { row: 0, column: 1 },
      { row: 1, column: 0 },
      { row: 1, column: 1 },
    ]);

    expect(MinesweeperCell.createEmptyCell(0, 0).getCellLabel()).toBe('11');
    expect(MinesweeperCell.createEmptyCell(9, 9).getCellLabel()).toBe('1010');
  });
});
