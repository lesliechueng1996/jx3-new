import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXPANSION_LEVEL,
  formatDateRange,
  toOptionalDate,
  toOptionalText,
} from '@/routes/_authenticated/admin/game-expansions/-lib/game-expansions-helpers';

describe('DEFAULT_EXPANSION_LEVEL', () => {
  it('is 130', () => {
    expect(DEFAULT_EXPANSION_LEVEL).toBe(130);
  });
});

describe('formatDateRange', () => {
  it('joins a closed range', () => {
    expect(formatDateRange('2024-01-01', '2024-12-31')).toBe(
      '2024-01-01 ~ 2024-12-31',
    );
  });

  it('labels an open range as in progress', () => {
    expect(formatDateRange('2024-01-01', null)).toBe('2024-01-01 ~ 进行中');
  });
});

describe('toOptionalText', () => {
  it('returns null for blank input', () => {
    expect(toOptionalText('  ')).toBeNull();
  });

  it('trims non-empty text', () => {
    expect(toOptionalText(' 描述 ')).toBe('描述');
  });
});

describe('toOptionalDate', () => {
  it('returns null for blank input', () => {
    expect(toOptionalDate('')).toBeNull();
  });

  it('keeps a date string', () => {
    expect(toOptionalDate('2024-01-01')).toBe('2024-01-01');
  });
});
