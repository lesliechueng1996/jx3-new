import { describe, expect, it } from 'bun:test';
import { ERROR_CODES } from '@api/shared/exception/error-code';

describe('ERROR_CODES', () => {
  it('exposes stable string codes', () => {
    expect(ERROR_CODES.SUCCESS).toBe('SUCCESS');
    expect(ERROR_CODES.IDIOM_NOT_FOUND).toBe('IDIOM_NOT_FOUND');
    expect(ERROR_CODES.USER_NOT_FOUND).toBe('USER_NOT_FOUND');
    expect(ERROR_CODES.SCHOOL_NOT_FOUND).toBe('SCHOOL_NOT_FOUND');
    expect(ERROR_CODES.KUNGFU_NOT_FOUND).toBe('KUNGFU_NOT_FOUND');
    expect(ERROR_CODES.IDION_DB_BROKEN_DATA).toBe('IDION_DB_BROKEN_DATA');
  });
});
