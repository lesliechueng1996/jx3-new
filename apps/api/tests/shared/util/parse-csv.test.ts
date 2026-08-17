import { describe, expect, it } from 'bun:test';
import { parseCsv, parseCsvHeaders } from '@api/shared/util/parse-csv';

describe('parseCsv', () => {
  it('returns an empty array for blank content', () => {
    expect(parseCsv(' \n\n ')).toEqual([]);
  });

  it('parses headers and rows, including quoted commas and escaped quotes', () => {
    const content = [
      'Text,Meaning',
      '一帆风顺,顺利',
      '"a,b","he said ""hi"""',
      'only-text',
    ].join('\n');

    expect(parseCsv(content)).toEqual([
      { text: '一帆风顺', meaning: '顺利' },
      { text: 'a,b', meaning: 'he said "hi"' },
      { text: 'only-text', meaning: '' },
    ]);
  });

  it('accepts CRLF line endings', () => {
    expect(parseCsv('text,meaning\r\n一帆风顺,顺利\r\n')).toEqual([
      { text: '一帆风顺', meaning: '顺利' },
    ]);
  });
});

describe('parseCsvHeaders', () => {
  it('returns an empty array when there is no header line', () => {
    expect(parseCsvHeaders('\n  \n')).toEqual([]);
  });

  it('lowercases and trims the first non-empty line', () => {
    expect(parseCsvHeaders('\n Text , Pinyin \n一帆风顺,yi1')).toEqual([
      'text',
      'pinyin',
    ]);
  });
});
