import { describe, expect, it, mock } from 'bun:test';

const format = mock((date: Date, pattern: string) => {
  return `${pattern}:${date.toISOString()}`;
});

mock.module('date-fns', () => ({
  format,
}));

const {
  formatDate,
  formatDateTime,
  formatDateTimeToMinute,
  shiftToTodayKeepingTime,
} = await import('@api/shared/util/date');

describe('date formatters', () => {
  const date = new Date('2026-02-01T12:00:00.123Z');

  it('formats a timestamp with milliseconds', () => {
    expect(formatDate(date)).toBe(
      'yyyy-MM-dd HH:mm:ss.SSS:2026-02-01T12:00:00.123Z',
    );
    expect(format).toHaveBeenCalledWith(date, 'yyyy-MM-dd HH:mm:ss.SSS');
  });

  it('formats a timestamp without milliseconds', () => {
    expect(formatDateTime(date)).toBe(
      'yyyy-MM-dd HH:mm:ss:2026-02-01T12:00:00.123Z',
    );
    expect(format).toHaveBeenCalledWith(date, 'yyyy-MM-dd HH:mm:ss');
  });

  it('formats a timestamp to the minute', () => {
    expect(formatDateTimeToMinute(date)).toBe(
      'yyyy-MM-dd HH:mm:2026-02-01T12:00:00.123Z',
    );
    expect(format).toHaveBeenCalledWith(date, 'yyyy-MM-dd HH:mm');
  });
});

describe('shiftToTodayKeepingTime', () => {
  it('keeps the clock time and moves the calendar date to today', () => {
    const source = new Date(2026, 7, 22, 21, 5, 30, 123);
    const today = new Date(2026, 7, 26, 10, 0, 0, 0);

    const result = shiftToTodayKeepingTime(source, today);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(7);
    expect(result.getDate()).toBe(26);
    expect(result.getHours()).toBe(21);
    expect(result.getMinutes()).toBe(5);
    expect(result.getSeconds()).toBe(30);
    expect(result.getMilliseconds()).toBe(123);
  });

  it('returns null when the source time is null', () => {
    expect(shiftToTodayKeepingTime(null)).toBeNull();
  });

  it('defaults today to the current date', () => {
    const now = new Date();
    const source = new Date(2020, 0, 1, 8, 30, 0, 0);
    const result = shiftToTodayKeepingTime(source);

    expect(result.getFullYear()).toBe(now.getFullYear());
    expect(result.getMonth()).toBe(now.getMonth());
    expect(result.getDate()).toBe(now.getDate());
    expect(result.getHours()).toBe(8);
    expect(result.getMinutes()).toBe(30);
  });
});
