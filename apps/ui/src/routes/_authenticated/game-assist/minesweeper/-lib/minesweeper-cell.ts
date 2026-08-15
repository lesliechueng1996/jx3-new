export enum MinesweeperCellType {
  EMPTY = 'empty',
  FLAGGED = 'flagged',
  EXPLODED = 'exploded',
}

type Position = {
  row: number;
  column: number;
};

export class MinesweeperCell {
  private type: MinesweeperCellType;
  private readonly row: number;
  private readonly column: number;
  private value: number;

  constructor(
    type: MinesweeperCellType,
    row: number,
    column: number,
    value: number,
  ) {
    this.type = type;
    this.row = row;
    this.column = column;
    this.value = value;
  }

  static createEmptyCell(row: number, column: number): MinesweeperCell {
    return new MinesweeperCell(MinesweeperCellType.EMPTY, row, column, 0);
  }

  isFlagged(): boolean {
    return this.type === MinesweeperCellType.FLAGGED;
  }

  isExploded(): boolean {
    return this.type === MinesweeperCellType.EXPLODED;
  }

  getRow(): number {
    return this.row;
  }

  getColumn(): number {
    return this.column;
  }

  getValue(): number {
    return this.value;
  }

  setValue(value: number): void {
    if (this.type !== MinesweeperCellType.EXPLODED) {
      return;
    }
    if (value < 0 || value > 8) {
      return;
    }
    this.value = value;
  }

  setFlag(): void {
    this.type = MinesweeperCellType.FLAGGED;
  }

  removeFlag(): void {
    if (this.type !== MinesweeperCellType.FLAGGED) {
      return;
    }
    this.type = MinesweeperCellType.EMPTY;
  }

  explode(value: number): void {
    if (this.type !== MinesweeperCellType.EMPTY) {
      return;
    }

    this.type = MinesweeperCellType.EXPLODED;
    this.value = value;
  }

  resetToEmpty(): void {
    this.type = MinesweeperCellType.EMPTY;
    this.value = 0;
  }

  getNeighborPositions(rows: number, columns: number): Position[] {
    const positions: Position[] = [];
    for (let row = this.row - 1; row <= this.row + 1; row++) {
      for (let column = this.column - 1; column <= this.column + 1; column++) {
        if (row === this.row && column === this.column) {
          continue;
        }
        if (row < 0 || row >= rows || column < 0 || column >= columns) {
          continue;
        }
        positions.push({ row, column });
      }
    }
    return positions;
  }

  getCellLabel(): string {
    if (this.column < 9) {
      return `${this.column + 1}${this.row + 1}`;
    }
    return `${this.column + 1}${(this.row + 1).toString().padStart(2, '0')}`;
  }

  getType(): MinesweeperCellType {
    return this.type;
  }
}
