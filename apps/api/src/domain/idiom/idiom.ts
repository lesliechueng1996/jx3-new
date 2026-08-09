import { logger } from '@api/infrastructure/logger';
import { pinyin } from 'pinyin-pro';
import { IdiomChar } from './idiom-char';

export class Idiom {
  text: string;
  meaning: string;
  chars: IdiomChar[] = [];
  pinyin: string = '';
  tonePattern: string = '';

  constructor(text: string, meaning: string = '') {
    this.text = text;
    this.meaning = meaning;
    this.#parsePinyin(text);
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
