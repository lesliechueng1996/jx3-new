import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { UpdateIdiomBody } from '@api/interface/schema/idiom-schema';
import {
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

const logger = {
  error: mock((message: string) => message),
};

const findByText = mock(async () => null as PhraseRow | null);
const create = mock(async () => ({ idiom: phraseRow(), chars: [charRow()] }));
const findById = mock(async () => phraseRow() as PhraseRow | null);
const deleteById = mock(async () => undefined);
const listPagination = mock(async () => [phraseRow()]);
const count = mock(async () => 1);
const updateById = mock(
  async (): Promise<{ idiom: PhraseRow; chars: CharRow[] } | null> => ({
    idiom: phraseRow(),
    chars: [charRow()],
  }),
);
const insertProcessedIdiom = mock(async () => undefined);
const findByPhraseId = mock(async () => [charRow()]);
const gameSearch = mock(async () => ({
  total: 0,
  items: [],
  analysis: { isUnique: false, byPosition: [], suggestedProbes: [] },
}));
const formatDateTime = mock((date: Date) => `fmt:${date.toISOString()}`);
const isUniqueViolationError = mock(
  (_error: unknown, _constraint?: string) => false,
);
const pickDefinedProperties = mock(
  (obj: object, _ignore?: string[]) => ({ ...obj }) as Record<string, unknown>,
);
const parseCsvHeaders = mock((_content: string) => ['text']);
const parseCsv = mock(
  (_content: string): Array<Record<string, string>> => [{ text: '一帆风顺' }],
);

type PhraseRow = {
  id: string;
  text: string;
  charCount: number;
  pinyin: string;
  tonePattern: string;
  meaning: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const phraseRow = (overrides: Partial<PhraseRow> = {}): PhraseRow => ({
  id: 'idiom-1',
  text: '一帆风顺',
  charCount: 4,
  pinyin: 'yi1 fan2 feng1 shun4',
  tonePattern: '1-2-1-4',
  meaning: 'smooth',
  createdAt,
  updatedAt,
  ...overrides,
});

const charRow = (overrides: Partial<CharRow> = {}): CharRow => ({
  id: 'char-1',
  idiomId: 'idiom-1',
  position: 0,
  char: '一',
  pinyin: 'yi1',
  initial: '',
  final: 'i',
  tone: 1,
  createdAt,
  updatedAt,
  ...overrides,
});

class FakeIdiom {
  text: string;
  meaning: string;
  chars: Array<{
    position: number;
    char: string;
    pinyin: string;
    initial: string;
    final: string;
    tone: number;
  }>;

  constructor(text: string, meaning = '', _pinyin = '') {
    this.text = text;
    this.meaning = meaning;
    this.chars = [...text].map((char, position) => ({
      position,
      char,
      pinyin: 'x1',
      initial: 'x',
      final: 'i',
      tone: 1,
    }));
  }
}

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/infrastructure/repository/idiom-phrase-repository', () => ({
  idiomPhraseRepository: {
    findByText,
    create,
    findById,
    deleteById,
    listPagination,
    count,
    updateById,
    insertProcessedIdiom,
  },
}));

mock.module('@api/infrastructure/repository/idiom-char-repository', () => ({
  idiomCharRepository: {
    findByPhraseId,
  },
}));

mock.module('@api/domain/model/idiom/idiom', () => ({
  Idiom: FakeIdiom,
}));

mock.module('@api/domain/model/idiom/idiom-game', () => ({
  IdiomGame: class {
    constructor(public props: unknown) {}
    search = gameSearch;
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

mock.module('@api/shared/util/db', () => ({
  isUniqueViolationError,
}));

mock.module('@api/shared/util/object', () => ({
  pickDefinedProperties,
}));

mock.module('@api/shared/util/parse-csv', () => ({
  parseCsv,
  parseCsvHeaders,
}));

const {
  createIdiom,
  getIdiom,
  deleteIdiom,
  listIdiomsPagination,
  updateIdiom,
  importIdiomsFromCsvFile,
  getPinyin,
  searchIdioms,
} = await import('@api/application/service/idiom-service');

const mappedChar = {
  id: 'char-1',
  idiomId: 'idiom-1',
  position: 0,
  char: '一',
  pinyin: 'yi1',
  initial: '',
  final: 'i',
  tone: 1,
  createdAt: `fmt:${createdAt.toISOString()}`,
  updatedAt: `fmt:${updatedAt.toISOString()}`,
};

describe('idiom-service', () => {
  beforeEach(() => {
    logger.error.mockReset();
    findByText.mockReset();
    create.mockReset();
    findById.mockReset();
    deleteById.mockReset();
    listPagination.mockReset();
    count.mockReset();
    updateById.mockReset();
    insertProcessedIdiom.mockReset();
    findByPhraseId.mockReset();
    gameSearch.mockReset();
    formatDateTime.mockReset();
    isUniqueViolationError.mockReset();
    pickDefinedProperties.mockReset();
    parseCsvHeaders.mockReset();
    parseCsv.mockReset();

    findByText.mockResolvedValue(null);
    create.mockResolvedValue({ idiom: phraseRow(), chars: [charRow()] });
    findById.mockResolvedValue(phraseRow());
    listPagination.mockResolvedValue([phraseRow()]);
    count.mockResolvedValue(1);
    updateById.mockResolvedValue({ idiom: phraseRow(), chars: [charRow()] });
    findByPhraseId.mockResolvedValue([charRow()]);
    gameSearch.mockResolvedValue({
      total: 1,
      items: [],
      analysis: { isUnique: true, byPosition: [], suggestedProbes: [] },
    });
    formatDateTime.mockImplementation(
      (date: Date) => `fmt:${date.toISOString()}`,
    );
    isUniqueViolationError.mockReturnValue(false);
    pickDefinedProperties.mockImplementation((obj: object) => ({ ...obj }));
    parseCsvHeaders.mockReturnValue(['text', 'pinyin', 'meaning']);
    parseCsv.mockReturnValue([
      { text: '一帆风顺', pinyin: 'yi1', meaning: 'smooth' },
    ]);
  });

  it('creates an idiom', async () => {
    const result = await createIdiom('一帆风顺');

    expect(create).toHaveBeenCalledWith(expect.any(FakeIdiom));
    expect(result).toMatchObject({
      id: 'idiom-1',
      text: '一帆风顺',
      chars: [mappedChar],
      createdAt: `fmt:${createdAt.toISOString()}`,
    });
  });

  it('rejects creating a duplicate idiom', async () => {
    findByText.mockResolvedValue(phraseRow());

    await expect(createIdiom('一帆风顺')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('maps a unique violation on create to a conflict', async () => {
    create.mockRejectedValue(new Error('dup'));
    isUniqueViolationError.mockReturnValue(true);

    await expect(createIdiom('一帆风顺', 'gloss')).rejects.toMatchObject({
      code: ERROR_CODES.IDIOM_ALREADY_EXISTS,
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it('rethrows unexpected create errors', async () => {
    const failure = new Error('db down');
    create.mockRejectedValue(failure);

    await expect(createIdiom('一帆风顺')).rejects.toBe(failure);
  });

  it('returns idiom detail', async () => {
    const result = await getIdiom('idiom-1');

    expect(findByPhraseId).toHaveBeenCalledWith('idiom-1');
    expect(result.chars[0]).toEqual(mappedChar);
  });

  it('throws when the idiom does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(getIdiom('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes by id', async () => {
    await deleteIdiom('idiom-1');
    expect(deleteById).toHaveBeenCalledWith('idiom-1');
  });

  it('lists idioms and treats a missing text filter as empty', async () => {
    const result = await listIdiomsPagination({ page: 2, pageSize: 10 });

    expect(listPagination).toHaveBeenCalledWith('', 10, 10);
    expect(count).toHaveBeenCalledWith('');
    expect(result).toMatchObject({ total: 1, page: 2, pageSize: 10 });
  });

  it('lists idioms with a text filter', async () => {
    await listIdiomsPagination({ page: 1, pageSize: 20, text: '一帆' });
    expect(listPagination).toHaveBeenCalledWith('一帆', 20, 0);
  });

  it('rejects an update whose char list does not match text length', async () => {
    await expect(
      updateIdiom('idiom-1', {
        text: '一帆风顺',
        chars: [{ id: 'c', position: 0, char: '一' }],
      } as UpdateIdiomBody),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates chars and derived tone pattern', async () => {
    const chars = [
      {
        id: 'c1',
        position: 0,
        char: '一',
        pinyin: 'yi1',
        initial: '',
        final: 'i',
        tone: 1,
      },
    ];
    pickDefinedProperties.mockReturnValue({ text: '一' });

    const result = await updateIdiom('idiom-1', {
      text: '一',
      chars,
    } as UpdateIdiomBody);

    expect(updateById).toHaveBeenCalledWith(
      'idiom-1',
      { text: '一', tonePattern: '1', charCount: 1 },
      chars,
    );
    expect(result.id).toBe('idiom-1');
  });

  it('updates charCount from text when chars are omitted', async () => {
    pickDefinedProperties.mockReturnValue({ text: '一帆风顺' });

    await updateIdiom('idiom-1', { text: '一帆风顺' });

    expect(updateById).toHaveBeenCalledWith(
      'idiom-1',
      { text: '一帆风顺', charCount: 4 },
      [],
    );
  });

  it('throws when update finds no row', async () => {
    updateById.mockResolvedValue(null);

    await expect(
      updateIdiom('idiom-1', { meaning: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps a unique violation on update to a conflict', async () => {
    updateById.mockRejectedValue(new Error('dup'));
    isUniqueViolationError.mockReturnValue(true);

    await expect(
      updateIdiom('idiom-1', { text: '一帆风顺' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows unexpected update errors', async () => {
    const failure = new Error('db down');
    updateById.mockRejectedValue(failure);

    await expect(updateIdiom('idiom-1', { meaning: 'x' })).rejects.toBe(
      failure,
    );
  });

  it('imports csv rows, skipping duplicates and recording failures', async () => {
    parseCsv.mockReturnValue([
      { text: '  ', pinyin: '', meaning: '' },
      { text: '一帆风顺', pinyin: 'yi1', meaning: '  ' },
      { text: '重复成语啊啊', pinyin: '', meaning: 'x' },
      { text: '失败成语啊啊', pinyin: '', meaning: 'x' },
      { text: '异常成语啊啊', pinyin: '', meaning: 'x' },
    ]);
    insertProcessedIdiom
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { unique: true }))
      .mockRejectedValueOnce(new BadRequestException('bad pinyin'))
      .mockRejectedValueOnce(new Error('boom'));
    isUniqueViolationError.mockImplementation((error: unknown) => {
      return Boolean((error as { unique?: boolean }).unique);
    });

    const file = new File(['csv'], 'idioms.csv', { type: 'text/csv' });
    const result = await importIdiomsFromCsvFile(file);

    expect(result).toEqual({
      created: 1,
      skipped: 1,
      failed: 3,
      errors: [
        { row: 2, text: '', message: 'text 不能为空' },
        { row: 5, text: '失败成语啊啊', message: 'bad pinyin' },
        { row: 6, text: '异常成语啊啊', message: '导入失败' },
      ],
    });
  });

  it('rejects an empty csv header', async () => {
    parseCsvHeaders.mockReturnValue([]);
    const file = new File([''], 'idioms.csv');

    await expect(importIdiomsFromCsvFile(file)).rejects.toMatchObject({
      code: ERROR_CODES.IDIOM_CSV_EMPTY_OR_MISSING_HEADERS,
    });
  });

  it('rejects a csv without a text column', async () => {
    parseCsvHeaders.mockReturnValue(['meaning']);
    const file = new File(['meaning\n'], 'idioms.csv');

    await expect(importIdiomsFromCsvFile(file)).rejects.toMatchObject({
      code: ERROR_CODES.IDIOM_CSV_MISSING_TEXT_COLUMN,
    });
  });

  it('rejects a csv that has headers but no rows', async () => {
    parseCsv.mockReturnValue([]);
    const file = new File(['text\n'], 'idioms.csv');

    await expect(importIdiomsFromCsvFile(file)).rejects.toMatchObject({
      code: ERROR_CODES.IDIOM_CSV_EMPTY,
    });
  });

  it('returns stored pinyin when the idiom is in the database', async () => {
    findByText.mockResolvedValue(phraseRow());
    findByPhraseId.mockResolvedValue([
      charRow(),
      charRow({ id: '2', position: 1, char: '帆' }),
      charRow({ id: '3', position: 2, char: '风' }),
      charRow({ id: '4', position: 3, char: '顺' }),
    ]);

    const result = await getPinyin('一帆风顺');

    expect(result).toMatchObject({
      inDatabase: true,
      idiomId: 'idiom-1',
      cells: expect.arrayContaining([
        expect.objectContaining({ position: 0, char: '一' }),
      ]),
    });
  });

  it('rejects stored pinyin when character counts disagree', async () => {
    findByText.mockResolvedValue(phraseRow({ charCount: 4 }));
    findByPhraseId.mockResolvedValue([charRow()]);

    await expect(getPinyin('一帆风顺')).rejects.toMatchObject({
      code: ERROR_CODES.IDION_DB_BROKEN_DATA,
    });
  });

  it('derives pinyin when the idiom is not stored', async () => {
    const result = await getPinyin('一帆风顺');

    expect(result).toMatchObject({
      inDatabase: false,
      idiomId: null,
      text: '一帆风顺',
    });
    expect(result.cells).toHaveLength(4);
  });

  it('searches with IdiomGame', async () => {
    const rounds = [{ text: '一帆风顺', cells: [] }];
    const result = await searchIdioms(rounds, 20);

    expect(result.total).toBe(1);
    expect(gameSearch).toHaveBeenCalled();
  });
});
