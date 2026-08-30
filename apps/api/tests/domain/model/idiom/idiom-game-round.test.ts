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

  it('accepts a black glyph already consumed by a green of the same glyph', () => {
    const candidate = {
      chars: [
        makeChar(0, { char: '不', initial: 'b', final: 'u', tone: 4 }),
        makeChar(1, { char: '堪', initial: 'k', final: 'an', tone: 1 }),
        makeChar(2, { char: '设', initial: 'sh', final: 'e', tone: 4 }),
        makeChar(3, { char: '想', initial: 'x', final: 'iang', tone: 3 }),
      ],
    } as Idiom;

    const round = makeRound(
      [
        makeCell(0, {
          char: '不',
          charColor: GREEN,
          initial: 'b',
          final: 'u',
          tone: 4,
        }),
        makeCell(1, {
          char: '声',
          initial: 'sh',
          initialColor: ORANGE,
          final: 'eng',
          tone: 1,
          toneColor: GREEN,
        }),
        makeCell(2, {
          char: '不',
          initial: 'b',
          final: 'u',
          tone: 4,
          toneColor: GREEN,
        }),
        makeCell(3, {
          char: '响',
          initial: 'x',
          initialColor: GREEN,
          final: 'iang',
          finalColor: GREEN,
          tone: 3,
          toneColor: GREEN,
          syllableLink: GREEN,
        }),
      ],
      '不声不响',
    );

    expect(round.explainFeedbackRejection(candidate)).toBeNull();
  });

  it('rejects a black glyph when a leftover copy remains after a green', () => {
    const candidate = {
      chars: [
        makeChar(0, { char: '不', initial: 'b', final: 'u', tone: 4 }),
        makeChar(1, { char: '声', initial: 'sh', final: 'eng', tone: 1 }),
        makeChar(2, { char: '不', initial: 'b', final: 'u', tone: 4 }),
        makeChar(3, { char: '响', initial: 'x', final: 'iang', tone: 3 }),
      ],
    } as Idiom;

    const round = makeRound(
      [
        makeCell(0, {
          char: '不',
          charColor: GREEN,
          initial: 'b',
          final: 'u',
          tone: 4,
        }),
        makeCell(1, {
          char: '声',
          charColor: GREEN,
          initial: 'sh',
          final: 'eng',
          tone: 1,
        }),
        makeCell(2, {
          char: '不',
          initial: 'b',
          initialColor: GREEN,
          final: 'u',
          finalColor: GREEN,
          tone: 4,
          toneColor: GREEN,
        }),
        makeCell(3, {
          char: '响',
          charColor: GREEN,
          initial: 'x',
          final: 'iang',
          tone: 3,
        }),
      ],
      '不声不响',
    );

    expect(round.explainFeedbackRejection(candidate)).toBe('char');
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

  it('skips a black empty initial when diagnosing another black remainder', () => {
    const round = makeRound(
      [0, 1, 2, 3].map((position) =>
        makeCell(position, {
          char: '春',
          charColor: BLACK,
          initial: position === 0 ? '' : position === 1 ? 'f' : 'x',
          initialColor: BLACK,
          final: 'x',
          finalColor: BLACK,
          tone: 3,
          toneColor: BLACK,
        }),
      ),
    );

    expect(round.explainFeedbackRejection(answer)).toContain(
      'initial:black-still-present@1',
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

  it('ignores a black empty initial so another zero-initial glyph can remain', () => {
    const candidate = {
      chars: [
        makeChar(0, { char: '震', initial: 'zh', final: 'en', tone: 4 }),
        makeChar(1, { char: '耳', initial: '', final: 'er', tone: 3 }),
        makeChar(2, { char: '欲', initial: 'y', final: 'u', tone: 4 }),
        makeChar(3, { char: '聋', initial: 'l', final: 'ong', tone: 2 }),
      ],
    } as Idiom;

    const round = makeRound(
      [
        makeCell(0, {
          char: '鹅',
          initial: '',
          final: 'e',
          tone: 2,
          toneColor: ORANGE,
        }),
        makeCell(1, {
          char: '行',
          initial: 'x',
          final: 'ing',
          tone: 2,
        }),
        makeCell(2, {
          char: '鸭',
          initial: 'y',
          initialColor: GREEN,
          final: 'a',
          tone: 1,
        }),
        makeCell(3, {
          char: '步',
          initial: 'b',
          final: 'u',
          finalColor: ORANGE,
          tone: 4,
          toneColor: ORANGE,
        }),
      ],
      '鹅行鸭步',
    );

    expect(round.explainFeedbackRejection(candidate)).toBeNull();
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
