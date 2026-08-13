import type { Idiom } from './idiom';
import type { IdiomChar } from './idiom-char';
import {
  type GreenLock,
  IdiomGameCell,
  IdiomGameCellColor,
  type IdiomGameCellConstructorParams,
  type SqlNecessaryCondition,
} from './idiom-game-cell';

export type IdiomGameRoundConstructorParams = {
  text: string;
  cells: IdiomGameCellConstructorParams[];
};

export class IdiomGameRound {
  private readonly text: string;
  private readonly cells: IdiomGameCell[];

  constructor(props: IdiomGameRoundConstructorParams) {
    this.text = props.text;
    this.cells = props.cells.map((cellProps) => new IdiomGameCell(cellProps));
  }

  collectGreenLocks(): GreenLock[] {
    return this.cells.flatMap((cell) => cell.collectGreenLocks());
  }

  extractSqlNecessaryConditions(): SqlNecessaryCondition[] {
    return this.cells.flatMap((cell) => cell.extractSqlNecessaryCondition());
  }

  #syllableKey(initial: string, final: string) {
    return `${initial}\0${final}`;
  }

  #validateSyllableLinks(chars: IdiomChar[]) {
    const considerCells = this.cells.filter((cell) => !cell.isCharGreen());
    if (considerCells.length === 0) {
      return true;
    }

    for (const cell of considerCells) {
      if (
        cell.syllableLink !== IdiomGameCellColor.GREEN ||
        cell.isCharGreen()
      ) {
        continue;
      }

      const answer = chars[cell.position];
      if (
        answer.initial !== cell.initial ||
        answer.final !== cell.final ||
        answer.char === cell.char
      ) {
        return false;
      }
    }

    return this.#validatePartMultiset(
      chars,
      considerCells.filter(
        (cell) => cell.syllableLink !== IdiomGameCellColor.GREEN,
      ),
      (cell) => cell.syllableLink,
      (cell) => this.#syllableKey(cell.initial, cell.final),
      (char) => this.#syllableKey(char.initial, char.final),
    );
  }

  validateFeedback(idiom: Idiom): boolean {
    if (
      !this.#validatePartConstraints(
        idiom.chars,
        (cell) => cell.initialColor,
        (cell) => cell.initial,
        (char) => char.initial,
      )
    ) {
      return false;
    }

    if (
      !this.#validatePartConstraints(
        idiom.chars,
        (cell) => cell.finalColor,
        (cell) => cell.final,
        (char) => char.final,
      )
    ) {
      return false;
    }

    if (
      !this.#validatePartConstraints(
        idiom.chars,
        (cell) => cell.toneColor,
        (cell) => String(cell.tone),
        (char) => String(char.tone),
      )
    ) {
      return false;
    }

    if (!this.#validateCharMultiset(idiom.chars)) {
      return false;
    }

    if (!this.#validateSyllableLinks(idiom.chars)) {
      return false;
    }

    return true;
  }

  #validateCharMultiset(chars: IdiomChar[]) {
    for (const cell of this.cells) {
      if (cell.charColor === IdiomGameCellColor.BLACK) {
        if (chars.some((char) => char.char === cell.char)) {
          return false;
        }
      }
    }

    for (const cell of this.cells) {
      if (cell.charColor === IdiomGameCellColor.GREEN) {
        const answer = chars[cell.position];
        if (answer.char !== cell.char) {
          return false;
        }
      }
    }

    const remaining = this.#buildRemainingCounts(chars, (char) => char.char);
    for (const cell of this.cells) {
      if (cell.charColor === IdiomGameCellColor.GREEN) {
        if (!this.#takeRemaining(remaining, cell.char)) {
          return false;
        }
      }
    }

    for (const cell of this.cells) {
      if (cell.charColor !== IdiomGameCellColor.ORANGE) {
        continue;
      }

      const answer = chars[cell.position];
      if (answer.char === cell.char) {
        return false;
      }

      if (!this.#takeRemaining(remaining, cell.char)) {
        return false;
      }
    }

    return true;
  }

  #buildRemainingCounts(
    chars: IdiomChar[],
    getValue: (item: IdiomChar) => string,
  ) {
    const remaining = new Map<string, number>();
    for (const char of chars) {
      const value = getValue(char);
      remaining.set(value, (remaining.get(value) ?? 0) + 1);
    }
    return remaining;
  }

  #takeRemaining(remaining: Map<string, number>, value: string) {
    const count = remaining.get(value) ?? 0;
    if (count <= 0) {
      return false;
    }
    remaining.set(value, count - 1);
    return true;
  }

  #validatePartMultiset(
    chars: IdiomChar[],
    cells: IdiomGameCell[],
    getColor: (cell: IdiomGameCell) => IdiomGameCellColor,
    getGuessValue: (cell: IdiomGameCell) => string,
    getAnswerValue: (item: IdiomChar) => string,
  ): boolean {
    for (const cell of cells) {
      if (getColor(cell) === IdiomGameCellColor.GREEN) {
        continue;
      }

      const answer = chars[cell.position];
      if (getAnswerValue(answer) !== getGuessValue(cell)) {
        return false;
      }
    }

    const remaining = this.#buildRemainingCounts(chars, getAnswerValue);

    for (const cell of cells) {
      if (getColor(cell) === IdiomGameCellColor.GREEN) {
        continue;
      }

      if (!this.#takeRemaining(remaining, getGuessValue(cell))) {
        return false;
      }
    }

    for (const cell of cells) {
      if (getColor(cell) !== IdiomGameCellColor.ORANGE) {
        continue;
      }

      const answer = chars[cell.position];
      if (getAnswerValue(answer) === getGuessValue(cell)) {
        return false;
      }

      if (!this.#takeRemaining(remaining, getGuessValue(cell))) {
        return false;
      }
    }

    for (const cell of cells) {
      if (getColor(cell) !== IdiomGameCellColor.BLACK) {
        continue;
      }

      const remainingCount = remaining.get(getGuessValue(cell)) ?? 0;
      if (remainingCount > 0) {
        return false;
      }
    }

    return true;
  }

  #validatePartConstraints(
    chars: IdiomChar[],
    getColor: (cell: IdiomGameCell) => IdiomGameCellColor,
    getGuessValue: (cell: IdiomGameCell) => string,
    getAnswerValue: (item: IdiomChar) => string,
  ): boolean {
    return this.#validatePartMultiset(
      chars,
      this.cells.filter((cell) => !cell.isCharGreen()),
      getColor,
      getGuessValue,
      getAnswerValue,
    );
  }
}
