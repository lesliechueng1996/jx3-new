import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  GreenLock,
  SqlNecessaryCondition,
} from '@api/domain/idiom/idiom-game-cell';
import type { IdiomGameRoundConstructorParams } from '@api/domain/idiom/idiom-game-round';
import { BadRequestException } from '@api/shared/exception';

const logger = {
  info: mock((message: string) => message),
  error: mock((message: string) => message),
};

const searchPhrases = mock(async () => [] as PhraseRow[]);
const findByPhraseIds = mock(async () => [] as CharRow[]);

const collectGreenLocks = mock((): GreenLock[] => []);
const extractSqlNecessaryConditions = mock((): SqlNecessaryCondition[] => []);
const explainFeedbackRejection = mock((_idiom: unknown): string | null => null);
const scoreCandidate = mock(() => ({ score: 2, reasonPosition: 0 }));

type PhraseRow = {
  id: string;
  text: string;
  meaning: string | null;
  pinyin: string;
  tonePattern: string;
};

type CharRow = {
  id: string;
  idiomId: string;
  position: number;
  char: string;
  pinyin: string;
  initial: string;
  final: string;
  tone: number;
};

const select = mock(() => ({
  from: mock(() => ({
    where: mock(() => ({})),
  })),
}));

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/infrastructure/repository/idiom-phrase-repository', () => ({
  idiomPhraseRepository: {
    search: searchPhrases,
  },
}));

mock.module('@api/infrastructure/repository/idiom-char-repository', () => ({
  idiomCharRepository: {
    findByPhraseIds,
  },
}));

mock.module('@api/shared/util/db', () => ({
  db: { select },
  and: mock((...parts: unknown[]) => ({ and: parts })),
  eq: mock((left: unknown, right: unknown) => ({ eq: [left, right] })),
  ne: mock((left: unknown, right: unknown) => ({ ne: [left, right] })),
  exists: mock((value: unknown) => ({ exists: value })),
  notExists: mock((value: unknown) => ({ notExists: value })),
  idiomChar: {
    id: 'char.id',
    idiomId: 'char.idiomId',
    position: 'char.position',
    char: 'char.char',
    initial: 'char.initial',
    final: 'char.final',
    tone: 'char.tone',
  },
  idiomPhrase: {
    id: 'phrase.id',
    charCount: 'phrase.charCount',
  },
}));

mock.module('@api/domain/idiom/idiom-game-round', () => ({
  IdiomGameRound: class {
    collectGreenLocks = collectGreenLocks;
    extractSqlNecessaryConditions = extractSqlNecessaryConditions;
    explainFeedbackRejection = explainFeedbackRejection;
  },
}));

mock.module('@api/domain/idiom/idiom', () => ({
  Idiom: class {
    id: string | null = null;
    text = '';
    meaning = '';
    pinyin = '';
    chars: Array<{
      char: string;
      initial: string;
      final: string;
      tone: number;
    }> = [];

    constructor(
      props: {
        id: string | null;
        text: string;
        meaning: string;
        pinyin: string;
        chars: Array<{
          char: string;
          initial: string;
          final: string;
          tone: number;
        }>;
      } & Record<string, unknown>,
    ) {
      Object.assign(this, props);
      if (props.text === '无id') {
        this.id = null;
      }
    }

    scoreCandidate = scoreCandidate;
  },
}));

mock.module('@api/domain/idiom/idiom-char', () => ({
  IdiomChar: class {
    constructor(props: Record<string, unknown>) {
      Object.assign(this, props);
    }
  },
}));

const { IdiomGame } = await import('@api/domain/idiom/idiom-game');

const round: IdiomGameRoundConstructorParams = {
  text: '一帆风顺',
  cells: [],
};

const makeChars = (idiomId: string, text: string): CharRow[] =>
  [...text].map((char, position) => ({
    id: `${idiomId}-${position}`,
    idiomId,
    position,
    char,
    pinyin: 'x1',
    initial: char,
    final: 'i',
    tone: 1,
  }));

const makePhrase = (
  id: string,
  text: string,
  meaning: string | null = 'gloss',
): PhraseRow => ({
  id,
  text,
  meaning,
  pinyin: 'x1 x1 x1 x1',
  tonePattern: '1-1-1-1',
});

describe('IdiomGame.search', () => {
  beforeEach(() => {
    logger.info.mockReset();
    logger.error.mockReset();
    searchPhrases.mockReset();
    findByPhraseIds.mockReset();
    collectGreenLocks.mockReset();
    extractSqlNecessaryConditions.mockReset();
    explainFeedbackRejection.mockReset();
    scoreCandidate.mockReset();

    searchPhrases.mockResolvedValue([]);
    findByPhraseIds.mockResolvedValue([]);
    collectGreenLocks.mockReturnValue([]);
    extractSqlNecessaryConditions.mockReturnValue([]);
    explainFeedbackRejection.mockReturnValue(null);
    scoreCandidate.mockReturnValue({ score: 2, reasonPosition: 0 });
  });

  it('rejects an empty round list', async () => {
    await expect(
      new IdiomGame({ rounds: [], limit: 20 }).search(),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-positive limit', async () => {
    await expect(
      new IdiomGame({ rounds: [round], limit: 0 }).search(),
    ).rejects.toMatchObject({ message: '回合限制数量不能小于等于0' });
  });

  it('rejects more rounds than the limit', async () => {
    await expect(
      new IdiomGame({ rounds: [round, round], limit: 1 }).search(),
    ).rejects.toMatchObject({ message: '已超出最大回合限制' });
  });

  it('returns an empty analysis when green locks contradict each other', async () => {
    collectGreenLocks.mockReturnValue([
      { kind: 'char', position: 0, value: '一' },
      undefined as unknown as GreenLock,
      { kind: 'char', position: 0, value: '二' },
    ]);

    const result = await new IdiomGame({ rounds: [round], limit: 20 }).search();

    expect(searchPhrases).not.toHaveBeenCalled();
    expect(result.total).toBe(0);
    expect(result.analysis.message).toContain('约束互相矛盾');
  });

  it('returns an empty analysis when nothing matches the rounds', async () => {
    const phrase = makePhrase('id-1', '一帆风顺');
    searchPhrases.mockResolvedValue([phrase]);
    findByPhraseIds.mockResolvedValue(makeChars('id-1', '一帆风顺'));
    explainFeedbackRejection.mockReturnValue('char');

    const result = await new IdiomGame({ rounds: [round], limit: 20 }).search();

    expect(result.total).toBe(0);
    expect(result.analysis.message).toContain('未找到匹配的成语');
    expect(logger.info).toHaveBeenCalled();
  });

  it('skips phrases without four characters and null ids', async () => {
    searchPhrases.mockResolvedValue([
      makePhrase('short', '一二三'),
      makePhrase('ok', '一帆风顺', null),
      makePhrase('noid', '无id成语啊'),
    ]);
    findByPhraseIds.mockResolvedValue([
      ...makeChars('short', '一二三'),
      ...makeChars('ok', '一帆风顺'),
      ...makeChars('noid', '无id成语啊'),
    ]);

    const result = await new IdiomGame({ rounds: [round], limit: 20 }).search();

    expect(result.total).toBe(1);
    expect(result.items).toEqual([
      {
        id: 'ok',
        text: '一帆风顺',
        pinyin: 'x1 x1 x1 x1',
        meaning: null,
      },
    ]);
    expect(result.analysis.isUnique).toBe(true);
    expect(result.analysis.message).toBe('找到唯一匹配');
    expect(result.analysis.suggestedProbes).toEqual([]);
  });

  it('omits probe suggestions when there are too many matches', async () => {
    const phrases = Array.from({ length: 31 }, (_, index) =>
      makePhrase(
        `id-${index}`,
        `成语${String(index).padStart(2, '0')}`.slice(0, 4),
      ),
    );
    searchPhrases.mockResolvedValue(phrases);
    findByPhraseIds.mockResolvedValue(
      phrases.flatMap((phrase) => makeChars(phrase.id, phrase.text)),
    );

    const result = await new IdiomGame({ rounds: [round], limit: 5 }).search();

    expect(result.total).toBe(31);
    expect(result.items).toHaveLength(5);
    expect(result.analysis.suggestedProbes).toEqual([]);
    expect(result.analysis.message).toContain('候选过多');
  });

  it('builds probe suggestions and keeps compatible SQL conditions', async () => {
    collectGreenLocks.mockReturnValue([
      { kind: 'char', position: 0, value: '一' },
      { kind: 'initial', position: 1, value: '帆' },
      { kind: 'final', position: 2, value: 'i' },
      { kind: 'tone', position: 3, value: 1 },
    ]);
    extractSqlNecessaryConditions.mockReturnValue([
      { kind: 'green', field: 'char', position: 0, value: '一' },
      { kind: 'green', field: 'char', position: 0, value: '一' },
      { kind: 'black', field: 'char', value: '春' },
      { kind: 'black', field: 'initial', value: 'b' },
      { kind: 'black', field: 'initial', value: 'f' },
      { kind: 'orange', field: 'final', position: 1, value: 'an' },
      { kind: 'green', field: 'tone', position: 3, value: 4 },
      {
        kind: 'green',
        field: 'unknown' as SqlNecessaryCondition['field'],
        position: 0,
        value: 'x',
      },
      {
        kind: 'mystery',
        field: 'char',
        value: 'x',
      } as unknown as SqlNecessaryCondition,
    ]);

    const first = makePhrase('id-1', '一帆风顺');
    const second = makePhrase('id-2', '一帆风顺');
    const third = makePhrase('id-3', '一帆风起');
    searchPhrases.mockResolvedValue([first, second, third]);
    findByPhraseIds.mockResolvedValue([
      ...makeChars('id-1', '一帆风顺'),
      ...makeChars('id-2', '一帆风顺'),
      ...makeChars('id-3', '一帆风起'),
    ]);
    scoreCandidate
      .mockReturnValueOnce({ score: 5, reasonPosition: 0 })
      .mockReturnValue({ score: 2, reasonPosition: 3 });

    const result = await new IdiomGame({ rounds: [round], limit: 20 }).search();

    expect(searchPhrases).toHaveBeenCalled();
    expect(result.total).toBe(3);
    expect(result.analysis.isUnique).toBe(false);
    expect(result.analysis.message).toBeUndefined();
    expect(result.analysis.suggestedProbes.length).toBeGreaterThan(0);
    expect(result.analysis.suggestedProbes[0]?.reason).toContain('第');
    expect(logger.error).toHaveBeenCalled();
  });

  it('drops candidates that fail a green lock, including a missing character', async () => {
    collectGreenLocks.mockReturnValue([
      { kind: 'char', position: 3, value: '顺' },
    ]);
    searchPhrases.mockResolvedValue([
      makePhrase('ok', '一帆风顺'),
      makePhrase('gap', '一二三四'),
    ]);
    findByPhraseIds.mockResolvedValue([
      ...makeChars('ok', '一帆风顺'),
      makeChars('gap', '一二三四')[0] as CharRow,
      makeChars('gap', '一二三四')[1] as CharRow,
      makeChars('gap', '一二三四')[2] as CharRow,
      {
        id: 'gap-3',
        idiomId: 'gap',
        position: 3,
        char: undefined as unknown as string,
        pinyin: '',
        initial: '',
        final: '',
        tone: 1,
      },
    ]);

    const result = await new IdiomGame({ rounds: [round], limit: 20 }).search();

    expect(result.items.map((item) => item.id)).toEqual(['ok']);
  });

  it('drops every candidate when a green lock kind is unknown', async () => {
    collectGreenLocks.mockReturnValue([
      { kind: 'other', position: 0, value: 'x' } as unknown as GreenLock,
    ]);
    searchPhrases.mockResolvedValue([makePhrase('ok', '一帆风顺')]);
    findByPhraseIds.mockResolvedValue(makeChars('ok', '一帆风顺'));

    const result = await new IdiomGame({ rounds: [round], limit: 20 }).search();

    expect(result.total).toBe(0);
  });
});
