import { describe, expect, it } from 'vitest';
import {
  formatAliasInput,
  parseAliasInput,
  schoolTypeBadgeClassName,
  schoolTypeLabel,
} from '@/routes/_authenticated/admin/schools/-lib/schools-helpers';

describe('schoolTypeLabel', () => {
  it('maps school and genre', () => {
    expect(schoolTypeLabel('school')).toBe('门派');
    expect(schoolTypeLabel('genre')).toBe('流派');
  });
});

describe('schoolTypeBadgeClassName', () => {
  it('maps school and genre', () => {
    expect(schoolTypeBadgeClassName('school')).toContain('bg-amber-500');
    expect(schoolTypeBadgeClassName('genre')).toContain('bg-cyan-500');
  });
});

describe('parseAliasInput', () => {
  it('splits, trims, and de-duplicates aliases', () => {
    expect(parseAliasInput(' 纯阳宫 , 花间，纯阳宫， ,万花')).toEqual([
      '纯阳宫',
      '花间',
      '万花',
    ]);
  });

  it('returns an empty list for blank input', () => {
    expect(parseAliasInput('  , ， ')).toEqual([]);
  });
});

describe('formatAliasInput', () => {
  it('joins aliases with a Chinese comma', () => {
    expect(formatAliasInput(['纯阳宫', '花间'])).toBe('纯阳宫，花间');
    expect(formatAliasInput([])).toBe('');
  });
});
