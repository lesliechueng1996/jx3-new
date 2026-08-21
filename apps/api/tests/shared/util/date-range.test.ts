import { describe, expect, it } from 'bun:test';
import {
  isDateWithinRange,
  isOwnDateRangeValid,
  isRangeWithinRange,
  toDateOnly,
} from '@api/shared/util/date-range';

describe('toDateOnly', () => {
  it('keeps the date part of an ISO string', () => {
    expect(toDateOnly('2026-03-15')).toBe('2026-03-15');
    expect(toDateOnly('2026-03-15T12:00:00.000Z')).toBe('2026-03-15');
  });

  it('formats a Date as UTC YYYY-MM-DD', () => {
    expect(toDateOnly(new Date('2026-03-15T00:00:00.000Z'))).toBe('2026-03-15');
  });
});

describe('isOwnDateRangeValid', () => {
  it('allows an open-ended range', () => {
    expect(isOwnDateRangeValid('2026-01-01', null)).toBe(true);
  });

  it('requires start to be on or before end', () => {
    expect(isOwnDateRangeValid('2026-01-01', '2026-01-01')).toBe(true);
    expect(isOwnDateRangeValid('2026-01-01', '2026-02-01')).toBe(true);
    expect(isOwnDateRangeValid('2026-02-01', '2026-01-01')).toBe(false);
  });
});

describe('isDateWithinRange', () => {
  it('rejects dates before the start', () => {
    expect(
      isDateWithinRange('2025-12-31', {
        startDate: '2026-01-01',
        endDate: null,
      }),
    ).toBe(false);
  });

  it('allows any date on or after start when the range is open', () => {
    expect(
      isDateWithinRange('2026-01-01', {
        startDate: '2026-01-01',
        endDate: null,
      }),
    ).toBe(true);
    expect(
      isDateWithinRange('2027-01-01', {
        startDate: '2026-01-01',
        endDate: null,
      }),
    ).toBe(true);
  });

  it('rejects dates after a closed end', () => {
    expect(
      isDateWithinRange('2026-12-31', {
        startDate: '2026-01-01',
        endDate: '2026-12-30',
      }),
    ).toBe(false);
    expect(
      isDateWithinRange('2026-12-30', {
        startDate: '2026-01-01',
        endDate: '2026-12-30',
      }),
    ).toBe(true);
  });
});

describe('isRangeWithinRange', () => {
  const outerClosed = { startDate: '2026-01-01', endDate: '2026-12-31' };
  const outerOpen = { startDate: '2026-01-01', endDate: null };

  it('rejects an invalid inner range', () => {
    expect(
      isRangeWithinRange(
        { startDate: '2026-06-01', endDate: '2026-01-01' },
        outerOpen,
      ),
    ).toBe(false);
  });

  it('rejects an inner start before the outer start', () => {
    expect(
      isRangeWithinRange(
        { startDate: '2025-12-01', endDate: '2026-02-01' },
        outerClosed,
      ),
    ).toBe(false);
  });

  it('allows an open inner range only when the outer range is open', () => {
    expect(
      isRangeWithinRange({ startDate: '2026-02-01', endDate: null }, outerOpen),
    ).toBe(true);
    expect(
      isRangeWithinRange(
        { startDate: '2026-02-01', endDate: null },
        outerClosed,
      ),
    ).toBe(false);
  });

  it('allows a closed inner range inside a closed or open outer range', () => {
    expect(
      isRangeWithinRange(
        { startDate: '2026-02-01', endDate: '2026-03-01' },
        outerClosed,
      ),
    ).toBe(true);
    expect(
      isRangeWithinRange(
        { startDate: '2026-02-01', endDate: '2026-03-01' },
        outerOpen,
      ),
    ).toBe(true);
    expect(
      isRangeWithinRange(
        { startDate: '2026-02-01', endDate: '2027-01-01' },
        outerClosed,
      ),
    ).toBe(false);
  });
});
