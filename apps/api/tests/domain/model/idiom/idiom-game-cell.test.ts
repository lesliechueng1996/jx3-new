import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { IdiomGameCellConstructorParams } from '@api/domain/model/idiom/idiom-game-cell';

const logger = {
  error: mock((message: string) => message),
};

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

const { IdiomGameCell, IdiomGameCellColor } = await import(
  '@api/domain/model/idiom/idiom-game-cell'
);

const base = (
  overrides: Partial<IdiomGameCellConstructorParams> = {},
): IdiomGameCellConstructorParams => ({
  position: 1,
  char: '风',
  charColor: IdiomGameCellColor.BLACK,
  initial: 'f',
  initialColor: IdiomGameCellColor.BLACK,
  final: 'eng',
  finalColor: IdiomGameCellColor.BLACK,
  tone: 1,
  toneColor: IdiomGameCellColor.BLACK,
  syllableLink: IdiomGameCellColor.BLACK,
  ...overrides,
});

describe('IdiomGameCell', () => {
  beforeEach(() => {
    logger.error.mockReset();
  });

  it('stores constructor fields', () => {
    const cell = new IdiomGameCell(
      base({ syllableLink: IdiomGameCellColor.GREEN }),
    );

    expect(cell.position).toBe(1);
    expect(cell.char).toBe('风');
    expect(cell.syllableLink).toBe(IdiomGameCellColor.GREEN);
    expect(cell.isCharGreen()).toBe(false);
  });

  it('collects only a char lock when the glyph is green', () => {
    const cell = new IdiomGameCell(
      base({
        charColor: IdiomGameCellColor.GREEN,
        initialColor: IdiomGameCellColor.GREEN,
        finalColor: IdiomGameCellColor.GREEN,
        toneColor: IdiomGameCellColor.GREEN,
      }),
    );

    expect(cell.isCharGreen()).toBe(true);
    expect(cell.collectGreenLocks()).toEqual([
      { kind: 'char', position: 1, value: '风' },
    ]);
  });

  it('collects phonetic green locks when the glyph is not green', () => {
    const cell = new IdiomGameCell(
      base({
        initialColor: IdiomGameCellColor.GREEN,
        finalColor: IdiomGameCellColor.GREEN,
        toneColor: IdiomGameCellColor.GREEN,
      }),
    );

    expect(cell.collectGreenLocks()).toEqual([
      { kind: 'initial', position: 1, value: 'f' },
      { kind: 'final', position: 1, value: 'eng' },
      { kind: 'tone', position: 1, value: 1 },
    ]);
  });

  it('returns an empty lock list when nothing is green', () => {
    expect(new IdiomGameCell(base()).collectGreenLocks()).toEqual([]);
  });

  it('extracts only a green char constraint when the glyph is green', () => {
    const cell = new IdiomGameCell(
      base({
        charColor: IdiomGameCellColor.GREEN,
        initialColor: IdiomGameCellColor.ORANGE,
      }),
    );

    expect(cell.extractSqlNecessaryCondition()).toEqual([
      { kind: 'green', field: 'char', position: 1, value: '风' },
    ]);
  });

  it('extracts black, orange, and green phonetic constraints', () => {
    const black = new IdiomGameCell(base());
    expect(black.extractSqlNecessaryCondition()).toEqual([
      { kind: 'black', field: 'char', value: '风' },
      { kind: 'black', field: 'initial', value: 'f' },
      { kind: 'black', field: 'final', value: 'eng' },
      { kind: 'black', field: 'tone', value: 1 },
    ]);

    const orange = new IdiomGameCell(
      base({
        charColor: IdiomGameCellColor.ORANGE,
        initialColor: IdiomGameCellColor.ORANGE,
        finalColor: IdiomGameCellColor.ORANGE,
        toneColor: IdiomGameCellColor.ORANGE,
      }),
    );
    expect(orange.extractSqlNecessaryCondition()).toEqual([
      { kind: 'orange', field: 'char', position: 1, value: '风' },
      { kind: 'orange', field: 'initial', position: 1, value: 'f' },
      { kind: 'orange', field: 'final', position: 1, value: 'eng' },
      { kind: 'orange', field: 'tone', position: 1, value: 1 },
    ]);

    const greenPhonetic = new IdiomGameCell(
      base({
        charColor: IdiomGameCellColor.ORANGE,
        initialColor: IdiomGameCellColor.GREEN,
        finalColor: IdiomGameCellColor.GREEN,
        toneColor: IdiomGameCellColor.GREEN,
      }),
    );
    expect(greenPhonetic.extractSqlNecessaryCondition()).toEqual([
      { kind: 'orange', field: 'char', position: 1, value: '风' },
      { kind: 'green', field: 'initial', position: 1, value: 'f' },
      { kind: 'green', field: 'final', position: 1, value: 'eng' },
      { kind: 'green', field: 'tone', position: 1, value: 1 },
    ]);
  });

  it('logs and skips an unknown char color', () => {
    const cell = new IdiomGameCell(
      base({
        charColor: 'purple' as IdiomGameCellConstructorParams['charColor'],
      }),
    );

    expect(cell.extractSqlNecessaryCondition()).toEqual([
      { kind: 'black', field: 'initial', value: 'f' },
      { kind: 'black', field: 'final', value: 'eng' },
      { kind: 'black', field: 'tone', value: 1 },
    ]);
    expect(logger.error).toHaveBeenCalledWith('未知颜色: purple');
  });
});
