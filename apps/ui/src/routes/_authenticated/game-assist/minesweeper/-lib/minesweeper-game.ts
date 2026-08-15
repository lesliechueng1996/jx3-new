import { MinesweeperCell, MinesweeperCellType } from './minesweeper-cell';

type CellConstraint = {
  unknowns: MinesweeperCell[];
  remainingMines: number;
};

type ComponentSolutions = {
  cells: MinesweeperCell[];
  solutions: boolean[][];
};

const MAX_CSP_COMPONENT_SIZE = 20;

export class MinesweeperGame {
  rows: number;
  columns: number;
  mines: number;
  cells: MinesweeperCell[][];

  constructor(rows: number, columns: number, mines: number) {
    this.rows = rows;
    this.columns = columns;
    this.mines = mines;
    this.cells = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: columns }, (_, column) =>
        MinesweeperCell.createEmptyCell(row, column),
      ),
    );
  }

  setFlag(row: number, column: number) {
    const cell = this.cells[row][column];
    cell.setFlag();
  }

  removeFlag(row: number, column: number) {
    const cell = this.cells[row][column];
    cell.removeFlag();
  }

  explode(row: number, column: number, value: number) {
    if (value < 0 || value > 8) {
      return;
    }
    const cell = this.cells[row][column];
    cell.explode(value);
  }

  toggleFlag(row: number, column: number) {
    const cell = this.cells[row][column];
    if (cell.isFlagged()) {
      cell.removeFlag();
      return;
    }
    cell.setFlag();
  }

  revealOrCycleValue(row: number, column: number, alreadySelected: boolean) {
    const cell = this.cells[row][column];
    if (cell.isFlagged()) {
      cell.removeFlag();
      cell.explode(0);
      return;
    }
    if (!cell.isExploded()) {
      cell.explode(0);
      return;
    }
    if (!alreadySelected) {
      return;
    }
    const nextValue = cell.getValue() >= 8 ? 0 : cell.getValue() + 1;
    cell.setValue(nextValue);
  }

  setCellValue(row: number, column: number, value: number) {
    if (value < 0 || value > 8) {
      return;
    }
    const cell = this.cells[row][column];
    if (cell.isFlagged()) {
      cell.removeFlag();
    }
    if (cell.isExploded()) {
      cell.setValue(value);
      return;
    }
    cell.explode(value);
  }

  resetCell(row: number, column: number) {
    const cell = this.cells[row][column];
    cell.resetToEmpty();
  }

  getFlaggedCount() {
    return this.cells.flat().filter((cell) => cell.isFlagged()).length;
  }

  applySuggestedFlags(positions: Array<{ row: number; column: number }>) {
    let count = 0;
    for (const position of positions) {
      const cell = this.cells[position.row]?.[position.column];
      if (!cell || cell.getType() !== MinesweeperCellType.EMPTY) {
        continue;
      }
      cell.setFlag();
      count += 1;
    }
    return count;
  }

  openSuggestedCells(
    openPositions: Array<{ row: number; column: number }>,
    minePositions: Array<{ row: number; column: number }>,
  ) {
    const knownMines = new Set<MinesweeperCell>();
    for (const position of minePositions) {
      const cell = this.cells[position.row]?.[position.column];
      if (cell) {
        knownMines.add(cell);
      }
    }
    const knownSafes = new Set<MinesweeperCell>();
    for (const position of openPositions) {
      const cell = this.cells[position.row]?.[position.column];
      if (cell) {
        knownSafes.add(cell);
      }
    }
    this.expandKnownByRemainingMines(knownMines, knownSafes);

    const undetermined: Array<{ row: number; column: number }> = [];
    for (const position of openPositions) {
      const cell = this.cells[position.row]?.[position.column];
      if (!cell) {
        continue;
      }
      if (cell.isFlagged()) {
        cell.removeFlag();
      }
      if (cell.getType() !== MinesweeperCellType.EMPTY) {
        continue;
      }
      const value = this.inferOpenedValue(cell, knownMines, knownSafes);
      cell.explode(value ?? 0);
      if (value === null) {
        undetermined.push(position);
      }
    }
    return undetermined;
  }

  private expandKnownByRemainingMines(
    knownMines: Set<MinesweeperCell>,
    knownSafes: Set<MinesweeperCell>,
  ) {
    const unknowns: MinesweeperCell[] = [];
    let flaggedCount = 0;
    for (const cell of this.cells.flat()) {
      if (cell.isFlagged() || knownMines.has(cell)) {
        flaggedCount += 1;
        continue;
      }
      if (cell.isExploded() || knownSafes.has(cell)) {
        continue;
      }
      if (cell.getType() === MinesweeperCellType.EMPTY) {
        unknowns.push(cell);
      }
    }

    const remainingMines = this.mines - flaggedCount;
    if (remainingMines === 0) {
      for (const cell of unknowns) {
        knownSafes.add(cell);
      }
      return;
    }
    if (remainingMines === unknowns.length) {
      for (const cell of unknowns) {
        knownMines.add(cell);
      }
    }
  }

  private inferOpenedValue(
    cell: MinesweeperCell,
    knownMines: Set<MinesweeperCell>,
    knownSafes: Set<MinesweeperCell>,
  ): number | null {
    let mines = 0;
    for (const neighbor of this.getNeighborCells(cell)) {
      if (neighbor.isFlagged() || knownMines.has(neighbor)) {
        mines += 1;
        continue;
      }
      if (neighbor.isExploded() || knownSafes.has(neighbor)) {
        continue;
      }
      return null;
    }
    return mines;
  }

  analyzeGame(enableCSP = false) {
    const needToExplodeCells = new Set<MinesweeperCell>();
    const needToFlagCells = new Set<MinesweeperCell>();
    this.applySimpleRules(needToFlagCells, needToExplodeCells);

    if (enableCSP) {
      const maxIterations = this.rows * this.columns;
      for (let iteration = 0; iteration < maxIterations; iteration += 1) {
        if (!this.applyCspRules(needToFlagCells, needToExplodeCells)) {
          break;
        }
        this.applySimpleRules(needToFlagCells, needToExplodeCells);
      }
    }

    return {
      needToExplodeCells: [...needToExplodeCells],
      needToFlagCells: [...needToFlagCells],
    };
  }

  private applySimpleRules(
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): void {
    const maxIterations = this.rows * this.columns;
    let progress = true;
    let iteration = 0;
    while (progress && iteration < maxIterations) {
      iteration += 1;
      const localProgress = this.applyLocalRules(flags, safes);
      const overlapProgress = this.applyOverlapRules(flags, safes);
      const remainingProgress = this.applyRemainingMineCount(flags, safes);
      progress = localProgress || overlapProgress || remainingProgress;
    }
  }

  private applyLocalRules(
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    let progress = false;
    for (const constraint of this.collectConstraints(flags, safes)) {
      if (constraint.remainingMines === constraint.unknowns.length) {
        progress = this.addFlags(constraint.unknowns, flags, safes) || progress;
      }
      if (constraint.remainingMines === 0) {
        progress = this.addSafes(constraint.unknowns, flags, safes) || progress;
      }
    }
    return progress;
  }

  private applyOverlapRules(
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    const constraints = this.collectConstraints(flags, safes);
    let progress = false;
    for (let i = 0; i < constraints.length; i++) {
      for (let j = i + 1; j < constraints.length; j++) {
        progress =
          this.applyOverlapBetween(
            constraints[i],
            constraints[j],
            flags,
            safes,
          ) || progress;
      }
    }
    return progress;
  }

  private applyOverlapBetween(
    first: CellConstraint,
    second: CellConstraint,
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    const firstUnknowns = new Set(first.unknowns);
    const secondUnknowns = new Set(second.unknowns);
    const shared = first.unknowns.filter((cell) => secondUnknowns.has(cell));
    if (shared.length === 0) {
      return false;
    }

    const onlyFirst = first.unknowns.filter(
      (cell) => !secondUnknowns.has(cell),
    );
    const onlySecond = second.unknowns.filter(
      (cell) => !firstUnknowns.has(cell),
    );
    const minShared = Math.max(
      0,
      first.remainingMines - onlyFirst.length,
      second.remainingMines - onlySecond.length,
    );
    const maxShared = Math.min(
      first.remainingMines,
      second.remainingMines,
      shared.length,
    );
    if (minShared > maxShared) {
      return false;
    }

    let progress = this.addBoundedDeductions(
      shared,
      minShared,
      maxShared,
      flags,
      safes,
    );
    progress =
      this.addBoundedDeductions(
        onlyFirst,
        first.remainingMines - maxShared,
        first.remainingMines - minShared,
        flags,
        safes,
      ) || progress;
    progress =
      this.addBoundedDeductions(
        onlySecond,
        second.remainingMines - maxShared,
        second.remainingMines - minShared,
        flags,
        safes,
      ) || progress;
    return progress;
  }

  private applyRemainingMineCount(
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    const unknowns: MinesweeperCell[] = [];
    let flaggedCount = 0;
    for (const cell of this.cells.flat()) {
      if (this.isFlaggedInAnalysis(cell, flags)) {
        flaggedCount += 1;
        continue;
      }
      if (this.isUnknown(cell, flags, safes)) {
        unknowns.push(cell);
      }
    }

    const remainingMines = this.mines - flaggedCount;
    if (remainingMines < 0 || remainingMines > unknowns.length) {
      return false;
    }
    if (remainingMines === unknowns.length) {
      return this.addFlags(unknowns, flags, safes);
    }
    if (remainingMines === 0) {
      return this.addSafes(unknowns, flags, safes);
    }
    return false;
  }

  private collectConstraints(
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): CellConstraint[] {
    const constraints: CellConstraint[] = [];
    for (const cell of this.cells.flat()) {
      if (cell.getType() !== MinesweeperCellType.EXPLODED) {
        continue;
      }

      const neighbors = this.getNeighborCells(cell);
      const unknowns = neighbors.filter((neighbor) =>
        this.isUnknown(neighbor, flags, safes),
      );
      const remainingMines =
        cell.getValue() -
        neighbors.filter((neighbor) =>
          this.isFlaggedInAnalysis(neighbor, flags),
        ).length;
      if (
        unknowns.length === 0 ||
        remainingMines < 0 ||
        remainingMines > unknowns.length
      ) {
        continue;
      }
      constraints.push({ unknowns, remainingMines });
    }
    return constraints;
  }

  private getNeighborCells(cell: MinesweeperCell): MinesweeperCell[] {
    return cell
      .getNeighborPositions(this.rows, this.columns)
      .map((position) => this.cells[position.row][position.column]);
  }

  private isUnknown(
    cell: MinesweeperCell,
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    return (
      cell.getType() === MinesweeperCellType.EMPTY &&
      !flags.has(cell) &&
      !safes.has(cell)
    );
  }

  private isFlaggedInAnalysis(
    cell: MinesweeperCell,
    flags: Set<MinesweeperCell>,
  ): boolean {
    return cell.getType() === MinesweeperCellType.FLAGGED || flags.has(cell);
  }

  private addBoundedDeductions(
    cells: MinesweeperCell[],
    minMines: number,
    maxMines: number,
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    if (cells.length === 0 || minMines !== maxMines) {
      return false;
    }
    if (minMines === cells.length) {
      return this.addFlags(cells, flags, safes);
    }
    if (minMines === 0) {
      return this.addSafes(cells, flags, safes);
    }
    return false;
  }

  private addFlags(
    cells: MinesweeperCell[],
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    let added = false;
    for (const cell of cells) {
      if (cell.getType() !== MinesweeperCellType.EMPTY) {
        continue;
      }
      if (flags.has(cell) || safes.has(cell)) {
        continue;
      }
      flags.add(cell);
      added = true;
    }
    return added;
  }

  private addSafes(
    cells: MinesweeperCell[],
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    let added = false;
    for (const cell of cells) {
      if (cell.getType() !== MinesweeperCellType.EMPTY) {
        continue;
      }
      if (flags.has(cell) || safes.has(cell)) {
        continue;
      }
      safes.add(cell);
      added = true;
    }
    return added;
  }

  private applyCspRules(
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    const unknowns: MinesweeperCell[] = [];
    let flaggedCount = 0;
    for (const cell of this.cells.flat()) {
      if (this.isFlaggedInAnalysis(cell, flags)) {
        flaggedCount += 1;
      } else if (this.isUnknown(cell, flags, safes)) {
        unknowns.push(cell);
      }
    }

    const remainingMines = this.mines - flaggedCount;
    if (remainingMines < 0 || remainingMines > unknowns.length) {
      return false;
    }

    const constraints = this.collectConstraints(flags, safes);
    const frontier = new Set<MinesweeperCell>();
    for (const constraint of constraints) {
      for (const cell of constraint.unknowns) {
        frontier.add(cell);
      }
    }
    if (frontier.size === 0) {
      return false;
    }

    const sea = unknowns.filter((cell) => !frontier.has(cell));
    const components = this.partitionFrontier([...frontier], constraints);
    const enumerated: ComponentSolutions[] = [];
    let skippedComponent = false;

    for (const cells of components) {
      if (cells.length > MAX_CSP_COMPONENT_SIZE) {
        skippedComponent = true;
        continue;
      }
      const cellSet = new Set(cells);
      const localConstraints = constraints.filter((constraint) =>
        constraint.unknowns.every((cell) => cellSet.has(cell)),
      );
      const solutions = this.enumerateComponent(cells, localConstraints);
      if (solutions.length === 0) {
        continue;
      }
      enumerated.push({ cells, solutions });
    }

    if (enumerated.length === 0) {
      return false;
    }

    const mineCountGroups = enumerated.map((component) =>
      uniqueMineCounts(component.solutions),
    );
    let progress = false;

    for (let index = 0; index < enumerated.length; index++) {
      const component = enumerated[index];
      let solutions = component.solutions;
      if (!skippedComponent) {
        const otherCounts = mineCountGroups.filter(
          (_, groupIndex) => groupIndex !== index,
        );
        const otherSums = combineMineCounts(otherCounts);
        const feasibleCounts = new Set(
          mineCountGroups[index].filter((count) =>
            isMineCountFeasible(count, otherSums, remainingMines, sea.length),
          ),
        );
        solutions = solutions.filter((solution) =>
          feasibleCounts.has(countMines(solution)),
        );
      }
      if (solutions.length === 0) {
        continue;
      }
      progress =
        this.addCspCellDeductions(component.cells, solutions, flags, safes) ||
        progress;
    }

    if (!skippedComponent) {
      progress =
        this.addSeaDeductions(
          sea,
          mineCountGroups,
          remainingMines,
          flags,
          safes,
        ) || progress;
    }

    return progress;
  }

  private addCspCellDeductions(
    cells: MinesweeperCell[],
    solutions: boolean[][],
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    let progress = false;
    for (let index = 0; index < cells.length; index++) {
      const alwaysMine = solutions.every((solution) => solution[index]);
      const alwaysSafe = solutions.every((solution) => !solution[index]);
      if (alwaysMine) {
        progress = this.addFlags([cells[index]], flags, safes) || progress;
      } else if (alwaysSafe) {
        progress = this.addSafes([cells[index]], flags, safes) || progress;
      }
    }
    return progress;
  }

  private addSeaDeductions(
    sea: MinesweeperCell[],
    mineCountGroups: number[][],
    remainingMines: number,
    flags: Set<MinesweeperCell>,
    safes: Set<MinesweeperCell>,
  ): boolean {
    const possibleSeaMines = new Set<number>();
    for (const sum of combineMineCounts(mineCountGroups)) {
      const seaMines = remainingMines - sum;
      if (seaMines >= 0 && seaMines <= sea.length) {
        possibleSeaMines.add(seaMines);
      }
    }
    if (possibleSeaMines.size !== 1) {
      return false;
    }
    const seaMines = [...possibleSeaMines][0];
    if (seaMines === 0) {
      return this.addSafes(sea, flags, safes);
    }
    if (seaMines === sea.length) {
      return this.addFlags(sea, flags, safes);
    }
    return false;
  }

  private partitionFrontier(
    frontier: MinesweeperCell[],
    constraints: CellConstraint[],
  ): MinesweeperCell[][] {
    const parent = new Map<MinesweeperCell, MinesweeperCell>();
    for (const cell of frontier) {
      parent.set(cell, cell);
    }

    const find = (cell: MinesweeperCell): MinesweeperCell => {
      let current = cell;
      let next = parent.get(current);
      while (next && next !== current) {
        current = next;
        next = parent.get(current);
      }
      return current;
    };

    const union = (left: MinesweeperCell, right: MinesweeperCell) => {
      const leftRoot = find(left);
      const rightRoot = find(right);
      if (leftRoot !== rightRoot) {
        parent.set(leftRoot, rightRoot);
      }
    };

    for (const constraint of constraints) {
      const first = constraint.unknowns[0];
      if (!first) {
        continue;
      }
      for (let index = 1; index < constraint.unknowns.length; index++) {
        union(first, constraint.unknowns[index]);
      }
    }

    const groups = new Map<MinesweeperCell, MinesweeperCell[]>();
    for (const cell of frontier) {
      const root = find(cell);
      const group = groups.get(root);
      if (group) {
        group.push(cell);
      } else {
        groups.set(root, [cell]);
      }
    }
    return [...groups.values()];
  }

  private enumerateComponent(
    cells: MinesweeperCell[],
    constraints: CellConstraint[],
  ): boolean[][] {
    const cellIndex = new Map(cells.map((cell, index) => [cell, index]));
    const mappedConstraints = constraints.map((constraint) => ({
      indices: constraint.unknowns.map((cell) => cellIndex.get(cell) ?? -1),
      remainingMines: constraint.remainingMines,
    }));
    const assignment = Array.from({ length: cells.length }, () => false);
    const solutions: boolean[][] = [];

    const isPartialValid = (assignedCount: number): boolean => {
      for (const constraint of mappedConstraints) {
        let mines = 0;
        let unassigned = 0;
        for (const index of constraint.indices) {
          if (index < assignedCount) {
            if (assignment[index]) {
              mines += 1;
            }
          } else {
            unassigned += 1;
          }
        }
        if (mines > constraint.remainingMines) {
          return false;
        }
        if (mines + unassigned < constraint.remainingMines) {
          return false;
        }
      }
      return true;
    };

    const search = (index: number) => {
      if (index === cells.length) {
        solutions.push(assignment.slice());
        return;
      }
      assignment[index] = false;
      if (isPartialValid(index + 1)) {
        search(index + 1);
      }
      assignment[index] = true;
      if (isPartialValid(index + 1)) {
        search(index + 1);
      }
    };

    search(0);
    return solutions;
  }
}

function countMines(solution: boolean[]): number {
  let count = 0;
  for (const isMine of solution) {
    if (isMine) {
      count += 1;
    }
  }
  return count;
}

function uniqueMineCounts(solutions: boolean[][]): number[] {
  return [...new Set(solutions.map(countMines))];
}

function combineMineCounts(countGroups: number[][]): Set<number> {
  let possible = new Set([0]);
  for (const counts of countGroups) {
    const next = new Set<number>();
    for (const previous of possible) {
      for (const count of counts) {
        next.add(previous + count);
      }
    }
    possible = next;
  }
  return possible;
}

function isMineCountFeasible(
  mineCount: number,
  otherSums: Set<number>,
  remainingMines: number,
  seaCount: number,
): boolean {
  for (const other of otherSums) {
    const seaMines = remainingMines - mineCount - other;
    if (seaMines >= 0 && seaMines <= seaCount) {
      return true;
    }
  }
  return false;
}
