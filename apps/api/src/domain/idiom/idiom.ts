import { logger } from '@api/infrastructure/logger';
import { BadRequestException, ERROR_CODES } from '@api/shared/exception';
import { convert, getInitialAndFinal, pinyin } from 'pinyin-pro';
import { IdiomChar } from './idiom-char';

export type IdiomConstructorParams = {
  id: string | null;
  text: string;
  meaning: string;
  chars: IdiomChar[];
  pinyin: string;
  tonePattern: string;
};

export class Idiom {
  id: string | null = null;
  text: string;
  meaning: string;
  chars: IdiomChar[] = [];
  pinyin: string = '';
  tonePattern: string = '';

  constructor(props: IdiomConstructorParams);
  constructor(text: string, meaning?: string, pinyin?: string);
  constructor(
    propsOrText: IdiomConstructorParams | string,
    meaning: string = '',
    pinyin: string = '',
  ) {
    if (typeof propsOrText === 'string') {
      this.text = propsOrText;
      this.meaning = meaning;
      if (pinyin) {
        this.#initWithPinyin(pinyin);
      } else {
        this.#parsePinyin(propsOrText);
      }
      return;
    }

    this.id = propsOrText.id;
    this.text = propsOrText.text;
    this.meaning = propsOrText.meaning;
    this.chars = propsOrText.chars;
    this.pinyin = propsOrText.pinyin;
    this.tonePattern = propsOrText.tonePattern;
  }

  #splitPinyinInput(pinyinInput: string) {
    return pinyinInput
      .trim()
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  #initWithPinyin(pinyin: string) {
    const syllables = this.#splitPinyinInput(pinyin);
    const chars = [...this.text];

    if (this.text.length === 0) {
      throw new BadRequestException(
        'text不能为空',
        ERROR_CODES.IDIOM_TEXT_EMPTY,
      );
    }

    if (syllables.length !== chars.length) {
      throw new BadRequestException(
        '拼音和成语长度不匹配',
        ERROR_CODES.IDIOM_PINYIN_LENGTH_MISMATCH,
      );
    }

    const processedChars = chars.map((char, position) => ({
      position,
      char,
      ...this.#parseSyllable(syllables[position] ?? ''),
    }));

    const normalizedPinyin = processedChars
      .map((item) => item.pinyin)
      .join(' ');

    this.pinyin = normalizedPinyin;
    this.tonePattern = processedChars.map((item) => item.tone).join('-');
    this.chars = processedChars.map((item, index) => {
      return new IdiomChar({
        id: null,
        char: item.char,
        position: index,
        pinyin: item.pinyin,
        initial: item.initial,
        final: item.final,
        tone: item.tone,
      });
    });
  }

  #toNumSyllable(syllable: string) {
    const trimmed = syllable.trim().toLowerCase();
    if (/\d$/.test(trimmed)) {
      return trimmed;
    }

    const normalized = convert(trimmed, { format: 'symbolToNum' });
    if (!normalized || !/\d$/.test(normalized)) {
      throw new BadRequestException(
        `无法识别拼音声调：${syllable}`,
        ERROR_CODES.IDIOM_UNRECOGNIZED_PINYIN_TONE,
      );
    }

    return normalized;
  }

  #parseSyllable(syllable: string) {
    const normalized = this.#toNumSyllable(syllable);
    const { initial, final } = getInitialAndFinal(normalized);
    const tone = Number(normalized.at(-1));

    if (!tone) {
      throw new BadRequestException(
        `无法识别拼音声调：${syllable}`,
        ERROR_CODES.IDIOM_UNRECOGNIZED_PINYIN_TONE,
      );
    }

    return {
      pinyin: normalized,
      initial,
      final: final.replace(/\d$/, ''),
      tone,
    };
  }

  #parsePinyin(text: string) {
    try {
      const result = pinyin(text, {
        toneType: 'num',
        type: 'all',
      });

      this.pinyin = result.map((item) => item.pinyin).join(' ');
      this.tonePattern = result.map((item) => item.num).join('-');
      this.chars = result.map((item, index) => {
        return new IdiomChar({
          id: null,
          char: item.origin,
          position: index,
          pinyin: item.pinyin,
          initial: item.initial,
          final: item.final.substring(0, item.final.length - 1),
          tone: item.num,
        });
      });
    } catch (error) {
      logger.error('Parse pinyin failed', { error });
      this.pinyin = '';
    }
  }

  isValid() {
    return this.pinyin !== '';
  }

  scoreCandidate(candidates: Idiom[]): {
    score: number;
    reasonPosition: number;
  } {
    let score = 0;
    let reasonPosition = 0;
    let maxDistinct = 0;

    for (let position = 0; position < 4; position += 1) {
      const charOptions = new Set(
        candidates
          .map((item) => item.chars[position].char)
          .filter((value): value is string => Boolean(value)),
      );

      const distinctCount = charOptions.size;
      if (distinctCount > 1) {
        score += distinctCount;
        if (distinctCount > maxDistinct) {
          maxDistinct = distinctCount;
          reasonPosition = position;
        }
      }

      const charAtPosition = this.chars[position].char;
      if (charAtPosition && distinctCount > 1) {
        const frequency =
          candidates.filter(
            (item) => item.chars[position].char === charAtPosition,
          ).length / candidates.length;
        if (frequency > 0.2 && frequency < 0.8) {
          score += 1;
        }
      }
    }

    return { score, reasonPosition };
  }
}
