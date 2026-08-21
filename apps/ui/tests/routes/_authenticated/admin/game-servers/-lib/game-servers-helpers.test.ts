import { describe, expect, it } from 'vitest';
import {
  formatAliasInput,
  parseAliasInput,
} from '@/routes/_authenticated/admin/game-servers/-lib/game-servers-helpers';

describe('parseAliasInput', () => {
  it('splits, trims, and de-duplicates aliases', () => {
    expect(parseAliasInput(' 梦岛 , 绝代，梦岛， ,奥黛')).toEqual([
      '梦岛',
      '绝代',
      '奥黛',
    ]);
  });

  it('returns an empty list for blank input', () => {
    expect(parseAliasInput('  , ， ')).toEqual([]);
  });
});

describe('formatAliasInput', () => {
  it('joins aliases with a Chinese comma', () => {
    expect(formatAliasInput(['梦岛', '绝代'])).toBe('梦岛，绝代');
    expect(formatAliasInput([])).toBe('');
  });
});
