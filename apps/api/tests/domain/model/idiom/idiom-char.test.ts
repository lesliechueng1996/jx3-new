import { describe, expect, it } from 'bun:test';
import { IdiomChar } from '@api/domain/model/idiom/idiom-char';

describe('IdiomChar', () => {
  it('copies constructor params onto the instance', () => {
    const char = new IdiomChar({
      id: 'char-1',
      char: '风',
      position: 2,
      pinyin: 'feng1',
      initial: 'f',
      final: 'eng',
      tone: 1,
    });

    expect(char).toMatchObject({
      id: 'char-1',
      char: '风',
      position: 2,
      pinyin: 'feng1',
      initial: 'f',
      final: 'eng',
      tone: 1,
    });
  });

  it('allows a null id', () => {
    const char = new IdiomChar({
      id: null,
      char: '一',
      position: 0,
      pinyin: 'yi1',
      initial: '',
      final: 'i',
      tone: 1,
    });

    expect(char.id).toBeNull();
  });
});
