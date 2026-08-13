import { logger } from '@api/infrastructure/logger';

export const IdiomGameCellColor = {
  BLACK: 'black',
  ORANGE: 'orange',
  GREEN: 'green',
} as const;

export type IdiomGameCellColor =
  (typeof IdiomGameCellColor)[keyof typeof IdiomGameCellColor];

export type IdiomGameCellConstructorParams = {
  position: number;
  char: string;
  charColor: IdiomGameCellColor;
  initial: string;
  initialColor: IdiomGameCellColor;
  final: string;
  finalColor: IdiomGameCellColor;
  tone: number;
  toneColor: IdiomGameCellColor;
  syllableLink: IdiomGameCellColor;
};

export type PhoneticField = 'char' | 'initial' | 'final' | 'tone';

export type SqlNecessaryCondition =
  | {
      kind: 'green';
      field: PhoneticField;
      position: number;
      value: string | number;
    }
  | {
      kind: 'orange';
      field: PhoneticField;
      position: number;
      value: string | number;
    }
  | {
      kind: 'black';
      field: PhoneticField;
      value: string | number;
    };

export type GreenLock =
  | { kind: 'char'; position: number; value: string }
  | { kind: 'initial'; position: number; value: string }
  | { kind: 'final'; position: number; value: string }
  | { kind: 'tone'; position: number; value: number };

export class IdiomGameCell {
  readonly position: number;
  readonly char: string;
  readonly charColor: IdiomGameCellColor;
  readonly initial: string;
  readonly initialColor: IdiomGameCellColor;
  readonly final: string;
  readonly finalColor: IdiomGameCellColor;
  readonly tone: number;
  readonly toneColor: IdiomGameCellColor;
  readonly syllableLink: IdiomGameCellColor;

  constructor(props: IdiomGameCellConstructorParams) {
    this.position = props.position;
    this.char = props.char;
    this.charColor = props.charColor;
    this.initial = props.initial;
    this.initialColor = props.initialColor;
    this.final = props.final;
    this.finalColor = props.finalColor;
    this.tone = props.tone;
    this.toneColor = props.toneColor;
    this.syllableLink = props.syllableLink;
  }

  collectGreenLocks(): GreenLock[] {
    const greenLocks: GreenLock[] = [];
    if (this.charColor === IdiomGameCellColor.GREEN) {
      greenLocks.push({
        kind: 'char',
        position: this.position,
        value: this.char,
      });
      return greenLocks;
    }

    if (this.initialColor === IdiomGameCellColor.GREEN) {
      greenLocks.push({
        kind: 'initial',
        position: this.position,
        value: this.initial,
      });
    }

    if (this.finalColor === IdiomGameCellColor.GREEN) {
      greenLocks.push({
        kind: 'final',
        position: this.position,
        value: this.final,
      });
    }

    if (this.toneColor === IdiomGameCellColor.GREEN) {
      greenLocks.push({
        kind: 'tone',
        position: this.position,
        value: this.tone,
      });
    }

    return greenLocks;
  }

  extractSqlNecessaryCondition() {
    // Green char locks the glyph; phonetic colors on this cell are feedback for
    // the guessed reading of that glyph, not independent answer constraints.
    if (this.charColor === IdiomGameCellColor.GREEN) {
      return [
        {
          kind: 'green' as const,
          field: 'char' as const,
          position: this.position,
          value: this.char,
        },
      ];
    }

    const sqlNecessaryConditions: SqlNecessaryCondition[] = [];

    switch (this.charColor) {
      case IdiomGameCellColor.BLACK:
        sqlNecessaryConditions.push({
          kind: 'black',
          field: 'char',
          value: this.char,
        });
        break;
      case IdiomGameCellColor.ORANGE:
        sqlNecessaryConditions.push({
          kind: 'orange',
          field: 'char',
          position: this.position,
          value: this.char,
        });
        break;
      default:
        logger.error(`未知颜色: ${this.charColor}`);
        break;
    }

    switch (this.initialColor) {
      case IdiomGameCellColor.GREEN:
        sqlNecessaryConditions.push({
          kind: 'green',
          field: 'initial',
          position: this.position,
          value: this.initial,
        });
        break;
      case IdiomGameCellColor.BLACK:
        sqlNecessaryConditions.push({
          kind: 'black',
          field: 'initial',
          value: this.initial,
        });
        break;
      case IdiomGameCellColor.ORANGE:
        sqlNecessaryConditions.push({
          kind: 'orange',
          field: 'initial',
          position: this.position,
          value: this.initial,
        });
        break;
    }

    switch (this.finalColor) {
      case IdiomGameCellColor.GREEN:
        sqlNecessaryConditions.push({
          kind: 'green',
          field: 'final',
          position: this.position,
          value: this.final,
        });
        break;
      case IdiomGameCellColor.BLACK:
        sqlNecessaryConditions.push({
          kind: 'black',
          field: 'final',
          value: this.final,
        });
        break;
      case IdiomGameCellColor.ORANGE:
        sqlNecessaryConditions.push({
          kind: 'orange',
          field: 'final',
          position: this.position,
          value: this.final,
        });
        break;
    }

    switch (this.toneColor) {
      case IdiomGameCellColor.GREEN:
        sqlNecessaryConditions.push({
          kind: 'green',
          field: 'tone',
          position: this.position,
          value: this.tone,
        });
        break;
      case IdiomGameCellColor.BLACK:
        sqlNecessaryConditions.push({
          kind: 'black',
          field: 'tone',
          value: this.tone,
        });
        break;
      case IdiomGameCellColor.ORANGE:
        sqlNecessaryConditions.push({
          kind: 'orange',
          field: 'tone',
          position: this.position,
          value: this.tone,
        });
        break;
    }

    return sqlNecessaryConditions;
  }

  isCharGreen() {
    return this.charColor === IdiomGameCellColor.GREEN;
  }
}
