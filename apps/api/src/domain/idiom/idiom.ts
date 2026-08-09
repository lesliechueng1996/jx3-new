import { logger } from '@api/infrastructure/logger';
import { BadRequestException, ERROR_CODES } from '@api/shared/exception';
import { convert, getInitialAndFinal, pinyin } from 'pinyin-pro';
import { IdiomChar } from './idiom-char';

export class Idiom {
  text: string;
  meaning: string;
  chars: IdiomChar[] = [];
  pinyin: string = '';
  tonePattern: string = '';

  constructor(text: string, meaning: string = '', pinyin: string = '') {
    this.text = text;
    this.meaning = meaning;
    if (pinyin) {
      this.#initWithPinyin(pinyin);
    } else {
      this.#parsePinyin(text);
    }
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
      return new IdiomChar(
        item.char,
        index,
        item.pinyin,
        item.initial,
        item.final,
        item.tone,
      );
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
        return new IdiomChar(
          item.origin,
          index,
          item.pinyin,
          item.initial,
          item.final.substring(0, item.final.length - 1),
          item.num,
        );
      });
    } catch (error) {
      logger.error('Parse pinyin failed', { error });
      this.pinyin = '';
    }
  }

  isValid() {
    return this.pinyin !== '';
  }
}
