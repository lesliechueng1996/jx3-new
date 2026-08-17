import { describe, expect, it } from 'bun:test';
import { pickDefinedProperties } from '@api/shared/util/object';

describe('pickDefinedProperties', () => {
  it('drops undefined values and ignored keys', () => {
    const result = pickDefinedProperties(
      {
        text: '一帆风顺',
        meaning: undefined,
        pinyin: 'yi1',
        chars: [{ char: '一' }],
      },
      ['chars'],
    );

    expect(result).toEqual({
      text: '一帆风顺',
      pinyin: 'yi1',
    });
  });

  it('keeps null, empty string, zero, and false', () => {
    expect(
      pickDefinedProperties({
        meaning: null,
        name: '',
        count: 0,
        banned: false,
      }),
    ).toEqual({
      meaning: null,
      name: '',
      count: 0,
      banned: false,
    });
  });

  it('ignores nothing when ignoreKeys is omitted', () => {
    expect(pickDefinedProperties({ a: 1, b: undefined })).toEqual({ a: 1 });
  });
});
