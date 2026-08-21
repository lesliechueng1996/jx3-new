import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { IdiomChar } from '@api/domain/model/idiom/idiom-char';
import { BadRequestException, ERROR_CODES } from '@api/shared/exception';

const logger = {
  error: mock((message: string) => message),
};
const pinyin = mock();
const convert = mock();
const getInitialAndFinal = mock();

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('pinyin-pro', () => ({
  pinyin,
  convert,
  getInitialAndFinal,
}));

const { Idiom } = await import('@api/domain/model/idiom/idiom');

const makeChar = (
  position: number,
  char: string,
  overrides: Partial<IdiomChar> = {},
) =>
  new IdiomChar({
    id: null,
    position,
    char,
    pinyin: `${char}1`,
    initial: char,
    final: 'i',
    tone: 1,
    ...overrides,
  });

describe('Idiom', () => {
  beforeEach(() => {
    logger.error.mockReset();
    pinyin.mockReset();
    convert.mockReset();
    getInitialAndFinal.mockReset();
    getInitialAndFinal.mockReturnValue({ initial: 'zh', final: 'ong1' });
  });

  it('hydrates from constructor params without parsing', () => {
    const chars = [makeChar(0, '一')];
    const idiom = new Idiom({
      id: 'id-1',
      text: '一',
      meaning: 'one',
      chars,
      pinyin: 'yi1',
      tonePattern: '1',
    });

    expect(idiom).toMatchObject({
      id: 'id-1',
      text: '一',
      meaning: 'one',
      chars,
      pinyin: 'yi1',
      tonePattern: '1',
    });
    expect(pinyin).not.toHaveBeenCalled();
  });

  it('parses pinyin from text when none is provided', () => {
    pinyin.mockReturnValue([
      {
        origin: '一',
        pinyin: 'yi1',
        initial: '',
        final: 'i1',
        num: 1,
      },
      {
        origin: '帆',
        pinyin: 'fan2',
        initial: 'f',
        final: 'an2',
        num: 2,
      },
    ]);

    const idiom = new Idiom('一帆', 'smooth');

    expect(idiom.meaning).toBe('smooth');
    expect(idiom.pinyin).toBe('yi1 fan2');
    expect(idiom.tonePattern).toBe('1-2');
    expect(idiom.isValid()).toBe(true);
    expect(idiom.chars).toHaveLength(2);
    expect(idiom.chars[0]).toMatchObject({
      char: '一',
      initial: '',
      final: 'i',
      tone: 1,
    });
  });

  it('records a parse failure and is not valid', () => {
    pinyin.mockImplementation(() => {
      throw new Error('pinyin-pro failed');
    });

    const idiom = new Idiom('一帆风顺');

    expect(logger.error).toHaveBeenCalled();
    expect(idiom.pinyin).toBe('');
    expect(idiom.isValid()).toBe(false);
  });

  it('builds chars from numeric pinyin syllables', () => {
    const idiom = new Idiom('一帆风顺', '', 'yi1 fan2 feng1 shun4');

    expect(idiom.pinyin).toBe('yi1 fan2 feng1 shun4');
    expect(idiom.tonePattern).toBe('1-2-1-4');
    expect(idiom.chars.map((item) => item.char).join('')).toBe('一帆风顺');
    expect(getInitialAndFinal).toHaveBeenCalledWith('yi1');
    expect(convert).not.toHaveBeenCalled();
  });

  it('converts symbol pinyin to numbered syllables', () => {
    convert.mockReturnValue('yi1');

    const idiom = new Idiom('一', '', 'yī');

    expect(convert).toHaveBeenCalledWith('yī', { format: 'symbolToNum' });
    expect(idiom.pinyin).toBe('yi1');
  });

  it('rejects empty text when pinyin is supplied', () => {
    expect(() => new Idiom('', '', 'yi1')).toThrow(BadRequestException);
    try {
      new Idiom('', '', 'yi1');
    } catch (error) {
      expect(error).toMatchObject({
        code: ERROR_CODES.IDIOM_TEXT_EMPTY,
      });
    }
  });

  it('rejects a pinyin length mismatch', () => {
    expect(() => new Idiom('一帆', '', 'yi1')).toThrow(BadRequestException);
    try {
      new Idiom('一帆', '', 'yi1');
    } catch (error) {
      expect(error).toMatchObject({
        code: ERROR_CODES.IDIOM_PINYIN_LENGTH_MISMATCH,
      });
    }
  });

  it('rejects a syllable whose tone cannot be converted', () => {
    convert.mockReturnValue('yi');

    expect(() => new Idiom('一', '', 'yi')).toThrow(BadRequestException);
    try {
      new Idiom('一', '', 'yi');
    } catch (error) {
      expect(error).toMatchObject({
        code: ERROR_CODES.IDIOM_UNRECOGNIZED_PINYIN_TONE,
      });
    }
  });

  it('rejects a numbered syllable with tone 0', () => {
    expect(() => new Idiom('一', '', 'yi0')).toThrow(BadRequestException);
  });

  it('scores candidates by distinct glyphs and mid-range frequency', () => {
    const answer = new Idiom({
      id: 'a',
      text: 'ABCD',
      meaning: '',
      pinyin: '',
      tonePattern: '',
      chars: [
        makeChar(0, 'A'),
        makeChar(1, 'B'),
        makeChar(2, 'C'),
        makeChar(3, 'D'),
      ],
    });
    const candidates = [
      answer,
      new Idiom({
        id: 'b',
        text: 'ABXY',
        meaning: '',
        pinyin: '',
        tonePattern: '',
        chars: [
          makeChar(0, 'A'),
          makeChar(1, 'B'),
          makeChar(2, 'X'),
          makeChar(3, 'Y'),
        ],
      }),
      new Idiom({
        id: 'c',
        text: 'ZQWE',
        meaning: '',
        pinyin: '',
        tonePattern: '',
        chars: [
          makeChar(0, 'Z'),
          makeChar(1, 'Q'),
          makeChar(2, 'W'),
          makeChar(3, 'E'),
        ],
      }),
    ];

    const result = answer.scoreCandidate(candidates);

    expect(result.score).toBeGreaterThan(0);
    expect(result.reasonPosition).toBeGreaterThanOrEqual(0);
    expect(result.reasonPosition).toBeLessThan(4);
  });

  it('ignores empty glyphs when scoring', () => {
    const thin = new Idiom({
      id: 'thin',
      text: '',
      meaning: '',
      pinyin: '',
      tonePattern: '',
      chars: [0, 1, 2, 3].map((position) => makeChar(position, '')),
    });

    expect(thin.scoreCandidate([thin]).score).toBe(0);
  });
});
