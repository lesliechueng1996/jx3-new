import { describe, expect, it, mock } from 'bun:test';
import type { Idiom } from '@api/domain/model/idiom/idiom';
import { IdiomChar } from '@api/domain/model/idiom/idiom-char';
import type { IdiomGameCellConstructorParams } from '@api/domain/model/idiom/idiom-game-cell';

mock.module('@api/infrastructure/logger', () => ({
  logger: { error: mock() },
}));

const { IdiomGameRound } = await import(
  '@api/domain/model/idiom/idiom-game-round'
);
const { IdiomGameCellColor: Color } = await import(
  '@api/domain/model/idiom/idiom-game-cell'
);

const BLACK = Color.BLACK;
const ORANGE = Color.ORANGE;
const GREEN = Color.GREEN;

const glyphs = ['一', '帆', '风', '顺'] as const;
const initials = ['', 'f', 'f', 'sh'] as const;
const finals = ['i', 'an', 'eng', 'un'] as const;
const tones = [1, 2, 1, 4] as const;

const makeChar = (position: number, overrides: Partial<IdiomChar> = {}) =>
  new IdiomChar({
    id: null,
    position,
    char: glyphs[position],
    pinyin: 'x1',
    initial: initials[position],
    final: finals[position],
    tone: tones[position],
    ...overrides,
  });

const answer = {
  chars: [0, 1, 2, 3].map((position) => makeChar(position)),
} as Idiom;

const makeCell = (
  position: number,
  overrides: Partial<IdiomGameCellConstructorParams> = {},
): IdiomGameCellConstructorParams => ({
  position,
  char: glyphs[position],
  charColor: BLACK,
  initial: initials[position],
  initialColor: BLACK,
  final: finals[position],
  finalColor: BLACK,
  tone: tones[position],
  toneColor: BLACK,
  syllableLink: BLACK,
  ...overrides,
});

const makeRound = (
  cells: IdiomGameCellConstructorParams[],
  text = '一帆风顺',
) => new IdiomGameRound({ text, cells });

const allGreenCells = () =>
  [0, 1, 2, 3].map((position) =>
    makeCell(position, {
      charColor: GREEN,
      initialColor: GREEN,
      finalColor: GREEN,
      toneColor: GREEN,
      syllableLink: GREEN,
    }),
  );

describe('IdiomGameRound', () => {
  it('accepts an all-green round that matches the answer', () => {
    const round = makeRound(allGreenCells());

    expect(round.validateFeedback(answer)).toBe(true);
    expect(round.explainFeedbackRejection(answer)).toBeNull();
    expect(round.collectGreenLocks()).toEqual(
      [0, 1, 2, 3].map((position) => ({
        kind: 'char' as const,
        position,
        value: glyphs[position],
      })),
    );
  });

  const greenAnswerTail = () =>
    [1, 2, 3].map((position) =>
      makeCell(position, {
        charColor: GREEN,
        initialColor: GREEN,
        finalColor: GREEN,
        toneColor: GREEN,
      }),
    );

  it('rejects a green glyph that does not sit on the answer', () => {
    const round = makeRound([
      makeCell(0, { char: '春', charColor: GREEN }),
      ...greenAnswerTail(),
    ]);

    expect(round.explainFeedbackRejection(answer)).toBe('char');
  });

  it('rejects a black glyph that still appears in the answer', () => {
    const round = makeRound([
      makeCell(0, {
        char: '一',
        charColor: BLACK,
        initial: 'x',
        initialColor: BLACK,
        final: 'x',
        finalColor: BLACK,
        tone: 3,
        toneColor: BLACK,
      }),
      ...greenAnswerTail(),
    ]);

    expect(round.explainFeedbackRejection(answer)).toBe('char');
  });

  it('rejects an orange glyph that sits on the same position', () => {
    const round = makeRound([
      makeCell(0, {
        charColor: ORANGE,
        initial: 'x',
        initialColor: BLACK,
        final: 'x',
        finalColor: BLACK,
        tone: 3,
        toneColor: BLACK,
      }),
      ...greenAnswerTail(),
    ]);

    expect(round.explainFeedbackRejection(answer)).toBe('char');
  });

  it('rejects an orange glyph that is missing from remaining counts', () => {
    const other = {
      chars: [
        makeChar(0, { char: '春', initial: 'ch', final: 'un', tone: 1 }),
        makeChar(1, { char: '天', initial: 't', final: 'ian', tone: 1 }),
        makeChar(2, { char: '一', initial: '', final: 'i', tone: 1 }),
        makeChar(3, { char: '海', initial: 'h', final: 'ai', tone: 3 }),
      ],
    } as Idiom;

    const round = makeRound([
      makeCell(0, { char: '春', charColor: GREEN }),
      makeCell(1, { char: '天', charColor: GREEN }),
      makeCell(2, {
        char: '一',
        charColor: ORANGE,
        initialColor: GREEN,
        initial: '',
        finalColor: GREEN,
        final: 'i',
        toneColor: GREEN,
        tone: 1,
      }),
      makeCell(3, {
        char: '一',
        charColor: ORANGE,
        initialColor: GREEN,
        initial: 'h',
        finalColor: GREEN,
        final: 'ai',
        toneColor: GREEN,
        tone: 3,
      }),
    ]);

    expect(round.explainFeedbackRejection(other)).toBe('char');
  });

  it('rejects a green initial that does not match the answer', () => {
    const round = makeRound([
      makeCell(0, { initial: 'b', initialColor: GREEN }),
      makeCell(1),
      makeCell(2),
      makeCell(3),
    ]);

    expect(round.explainFeedbackRejection(answer)).toBe(
      'initial:green@0 want=b got=',
    );
  });

  it('rejects an orange initial on the same position', () => {
    const round = makeRound(
      [0, 1, 2, 3].map((position) =>
        makeCell(position, {
          charColor: BLACK,
          char: '春',
          initialColor: position === 1 ? ORANGE : BLACK,
          initial: position === 1 ? 'f' : 'x',
          finalColor: BLACK,
          final: 'x',
          toneColor: BLACK,
          tone: 3,
        }),
      ),
    );

    expect(round.explainFeedbackRejection(answer)).toContain(
      'initial:orange-same-pos@1',
    );
  });

  it('rejects a black initial that remains after greens are consumed', () => {
    const round = makeRound(
      [0, 1, 2, 3].map((position) =>
        makeCell(position, {
          char: '春',
          charColor: BLACK,
          initial: position === 0 ? 'f' : 'x',
          initialColor: position === 0 ? BLACK : BLACK,
          final: 'x',
          finalColor: BLACK,
          tone: 3,
          toneColor: BLACK,
        }),
      ),
    );

    expect(round.explainFeedbackRejection(answer)).toContain(
      'initial:black-still-present@0',
    );
  });

  it('rejects an orange initial that is missing from remaining counts', () => {
    const round = makeRound(
      [0, 1, 2, 3].map((position) =>
        makeCell(position, {
          char: '春',
          charColor: BLACK,
          initial: 'z',
          initialColor: position === 0 ? ORANGE : BLACK,
          final: 'x',
          finalColor: BLACK,
          tone: 3,
          toneColor: BLACK,
        }),
      ),
    );

    expect(round.explainFeedbackRejection(answer)).toContain(
      'initial:orange-missing@0',
    );
  });

  it('rejects a green syllable link whose reading does not match', () => {
    const round = makeRound([
      makeCell(0, {
        char: '春',
        charColor: BLACK,
        initial: 'b',
        initialColor: BLACK,
        final: 'x',
        finalColor: BLACK,
        tone: 3,
        toneColor: BLACK,
        syllableLink: GREEN,
      }),
      makeCell(1, {
        char: '夏',
        charColor: BLACK,
        initial: 'x',
        final: 'x',
        tone: 3,
      }),
      makeCell(2, {
        char: '秋',
        charColor: BLACK,
        initial: 'x',
        final: 'x',
        tone: 3,
      }),
      makeCell(3, {
        char: '冬',
        charColor: BLACK,
        initial: 'x',
        final: 'x',
        tone: 3,
      }),
    ]);

    expect(round.explainFeedbackRejection(answer)).toBe('syllableLink');
  });

  it('accepts a green syllable link for a different glyph with the same reading', () => {
    const round = makeRound([
      makeCell(0, {
        char: '依',
        charColor: BLACK,
        initialColor: GREEN,
        finalColor: GREEN,
        syllableLink: GREEN,
        toneColor: GREEN,
      }),
      ...greenAnswerTail(),
    ]);

    expect(round.validateFeedback(answer)).toBe(true);
  });

  it('extracts SQL constraints from every cell', () => {
    const round = makeRound(allGreenCells());

    expect(round.extractSqlNecessaryConditions()).toEqual(
      [0, 1, 2, 3].map((position) => ({
        kind: 'green' as const,
        field: 'char' as const,
        position,
        value: glyphs[position],
      })),
    );
  });
});
