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
  private readonly cells: IdiomGameCell[];

  constructor(props: IdiomGameRoundConstructorParams) {
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

  /**
   * Green initial+final at the same cell already prove that syllable sits here.
   * Treat the link as green so a leftover default-black link cannot contradict it.
   */
  #effectiveSyllableLink(cell: IdiomGameCell): IdiomGameCellColor {
    if (
      cell.initialColor === IdiomGameCellColor.GREEN &&
      cell.finalColor === IdiomGameCellColor.GREEN
    ) {
      return IdiomGameCellColor.GREEN;
    }
    return cell.syllableLink;
  }

  #charGreenPositions(): number[] {
    return this.cells
      .filter((cell) => cell.isCharGreen())
      .map((cell) => cell.position);
  }

  #validateSyllableLinks(chars: IdiomChar[]) {
    const lockedPositions = this.#charGreenPositions();
    const considerCells = this.cells.filter((cell) => !cell.isCharGreen());
    if (considerCells.length === 0) {
      return true;
    }

    for (const cell of considerCells) {
      if (this.#effectiveSyllableLink(cell) !== IdiomGameCellColor.GREEN) {
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

    // Include green links so they consume from remaining before orange/black.
    return this.#validatePartMultiset(
      chars,
      considerCells,
      (cell) => this.#effectiveSyllableLink(cell),
      (cell) => this.#syllableKey(cell.initial, cell.final),
      (char) => this.#syllableKey(char.initial, char.final),
      lockedPositions,
    );
  }

  validateFeedback(idiom: Idiom): boolean {
    return this.explainFeedbackRejection(idiom) === null;
  }

  /** Returns which constraint rejected the candidate, or null if it matches. */
  explainFeedbackRejection(idiom: Idiom): string | null {
    const initialRejection = this.#explainPartRejection(
      idiom.chars,
      (cell) => cell.initialColor,
      (cell) => cell.initial,
      (char) => char.initial,
      'initial',
    );
    if (initialRejection) {
      return initialRejection;
    }

    const finalRejection = this.#explainPartRejection(
      idiom.chars,
      (cell) => cell.finalColor,
      (cell) => cell.final,
      (char) => char.final,
      'final',
    );
    if (finalRejection) {
      return finalRejection;
    }

    const toneRejection = this.#explainPartRejection(
      idiom.chars,
      (cell) => cell.toneColor,
      (cell) => String(cell.tone),
      (char) => String(char.tone),
      'tone',
    );
    if (toneRejection) {
      return toneRejection;
    }

    if (!this.#validateCharMultiset(idiom.chars)) {
      return 'char';
    }

    if (!this.#validateSyllableLinks(idiom.chars)) {
      return 'syllableLink';
    }

    return null;
  }

  #explainPartRejection(
    chars: IdiomChar[],
    getColor: (cell: IdiomGameCell) => IdiomGameCellColor,
    getGuessValue: (cell: IdiomGameCell) => string,
    getAnswerValue: (item: IdiomChar) => string,
    field: string,
  ): string | null {
    const cells = this.cells.filter((cell) => !cell.isCharGreen());
    const lockedPositions = this.#charGreenPositions();
    if (
      this.#validatePartMultiset(
        chars,
        cells,
        getColor,
        getGuessValue,
        getAnswerValue,
        lockedPositions,
      )
    ) {
      return null;
    }

    for (const cell of cells) {
      if (getColor(cell) !== IdiomGameCellColor.GREEN) {
        continue;
      }
      const answer = chars[cell.position];
      if (getAnswerValue(answer) !== getGuessValue(cell)) {
        return `${field}:green@${cell.position} want=${getGuessValue(cell)} got=${getAnswerValue(answer)}`;
      }
    }

    const remaining = this.#buildRemainingCounts(chars, getAnswerValue);
    for (const position of lockedPositions) {
      const answer = chars[position];
      if (!answer || !this.#takeRemaining(remaining, getAnswerValue(answer))) {
        return `${field}:locked@${position}`;
      }
    }
    for (const cell of cells) {
      if (getColor(cell) !== IdiomGameCellColor.GREEN) {
        continue;
      }
      if (!this.#takeRemaining(remaining, getGuessValue(cell))) {
        return `${field}:green-count@${cell.position} value=${getGuessValue(cell)}`;
      }
    }

    for (const cell of cells) {
      if (getColor(cell) !== IdiomGameCellColor.ORANGE) {
        continue;
      }
      const answer = chars[cell.position];
      if (getAnswerValue(answer) === getGuessValue(cell)) {
        return `${field}:orange-same-pos@${cell.position} value=${getGuessValue(cell)}`;
      }
      if (!this.#takeRemaining(remaining, getGuessValue(cell))) {
        return `${field}:orange-missing@${cell.position} value=${getGuessValue(cell)}`;
      }
    }

    for (const cell of cells) {
      if (getColor(cell) !== IdiomGameCellColor.BLACK) {
        continue;
      }
      const value = getGuessValue(cell);
      const remainingCount = remaining.get(value) ?? 0;
      if (remainingCount > 0) {
        return `${field}:black-still-present@${cell.position} value=${value} left=${remainingCount}`;
      }
    }

    return `${field}:unknown`;
  }

  #validateCharMultiset(chars: IdiomChar[]) {
    // Same Wordle accounting as phonetics: black means no extras after
    // greens/oranges, not "this glyph is absent from the whole answer".
    return this.#validatePartMultiset(
      chars,
      this.cells,
      (cell) => cell.charColor,
      (cell) => cell.char,
      (char) => char.char,
    );
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
    lockedPositions: number[] = [],
  ): boolean {
    // Green: value must sit at this position (same shape as #validateCharMultiset).
    for (const cell of cells) {
      if (getColor(cell) !== IdiomGameCellColor.GREEN) {
        continue;
      }

      const answer = chars[cell.position];
      if (getAnswerValue(answer) !== getGuessValue(cell)) {
        return false;
      }
    }

    const remaining = this.#buildRemainingCounts(chars, getAnswerValue);

    // Char-green glyphs lock their answer phonetics even though field colors on
    // that cell are ignored — consume them before orange/black accounting.
    for (const position of lockedPositions) {
      const answer = chars[position];
      if (!answer || !this.#takeRemaining(remaining, getAnswerValue(answer))) {
        return false;
      }
    }

    // Consume green slots first so orange/black see leftover counts only.
    for (const cell of cells) {
      if (getColor(cell) !== IdiomGameCellColor.GREEN) {
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
}
