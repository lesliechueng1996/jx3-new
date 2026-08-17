import { describe, expect, it, mock } from 'bun:test';

const format = mock((date: Date, pattern: string) => {
  return `${pattern}:${date.toISOString()}`;
});

mock.module('date-fns', () => ({
  format,
}));

const { formatDate, formatDateTime } = await import('@api/shared/util/date');

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
});
