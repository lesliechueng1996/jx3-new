import { describe, expect, it } from 'bun:test';
import { maskEmail } from '@api/shared/util/email';

describe('maskEmail', () => {
  it('keeps the first local character and the domain', () => {
    expect(maskEmail('alice@example.com')).toBe('a***@example.com');
  });

  it('masks a single-character local part', () => {
    expect(maskEmail('a@b.com')).toBe('a***@b.com');
  });

  it('returns *** when the address has no @', () => {
    expect(maskEmail('not-an-email')).toBe('***');
  });

  it('returns *** when the local part is empty', () => {
    expect(maskEmail('@example.com')).toBe('***');
  });

  it('returns *** when the domain is empty', () => {
    expect(maskEmail('alice@')).toBe('***');
  });
});
