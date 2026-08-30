import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import type { RaidRunCalendarItem } from '@/lib/api/raid-runs-api';
import {
  formatRaidClock,
  toCalendarEvents,
  toCalendarQueryRange,
  toShanghaiZonedDateTime,
} from '@/routes/_authenticated/-lib/raid-calendar';

const item = (
  overrides: Partial<RaidRunCalendarItem> = {},
): RaidRunCalendarItem => ({
  id: 'run-1',
  name: '周六团',
  status: 'recruiting',
  gatherTime: '2026-08-22T12:00:00.000Z',
  startTime: '2026-08-22T13:00:00.000Z',
  endTime: '2026-08-22T16:00:00.000Z',
  dungeonName: '25人英雄河阳之战',
  ...overrides,
});

describe('raid-calendar', () => {
  it('maps a raid run onto a timed calendar event', () => {
    const [event] = toCalendarEvents([item()]);

    expect(event?.id).toBe('run-1');
    expect(event?.title).toBe('周六团');
    expect(event?.calendarId).toBe('recruiting');
    expect(event?.raidGatherTime).toBe('2026-08-22T12:00:00.000Z');
    expect(event?.raidStartTime).toBe('2026-08-22T13:00:00.000Z');
    expect(event?.raidEndTime).toBe('2026-08-22T16:00:00.000Z');
    expect(event?.dungeonName).toBe('25人英雄河阳之战');
    expect(event?.start.toString()).toBe(
      toShanghaiZonedDateTime('2026-08-22T12:00:00.000Z').toString(),
    );
    expect(event?.end.toString()).toBe(
      toShanghaiZonedDateTime('2026-08-22T16:00:00.000Z').toString(),
    );
  });

  it('skips unpublished pending raid runs', () => {
    expect(toCalendarEvents([item({ status: 'pending' })])).toEqual([]);
  });

  it('uses startTime when gatherTime is missing', () => {
    const [event] = toCalendarEvents([item({ gatherTime: null })]);

    expect(event?.start.toString()).toBe(
      toShanghaiZonedDateTime('2026-08-22T13:00:00.000Z').toString(),
    );
  });

  it('extends a zero-length event by 30 minutes', () => {
    const [event] = toCalendarEvents([
      item({
        gatherTime: '2026-08-22T13:00:00.000Z',
        startTime: '2026-08-22T13:00:00.000Z',
        endTime: '2026-08-22T13:00:00.000Z',
      }),
    ]);
    const start = toShanghaiZonedDateTime('2026-08-22T13:00:00.000Z');

    expect(event?.end.toString()).toBe(start.add({ minutes: 30 }).toString());
  });

  it('falls back to startTime when endTime is missing', () => {
    const [event] = toCalendarEvents([item({ endTime: null })]);
    const start = toShanghaiZonedDateTime('2026-08-22T12:00:00.000Z');
    const endFromStart = toShanghaiZonedDateTime('2026-08-22T13:00:00.000Z');

    expect(event?.end.toString()).toBe(endFromStart.toString());
    expect(
      Temporal.Instant.compare(
        event?.end.toInstant() ?? start.toInstant(),
        start.toInstant(),
      ),
    ).toBe(1);
  });

  it('formats shanghai clock labels', () => {
    expect(formatRaidClock(null)).toBe('—');
    expect(formatRaidClock('2026-08-22T13:00:00.000Z')).toBe('21:00');
  });

  it('converts a schedule-x range into inclusive query dates', () => {
    expect(
      toCalendarQueryRange({
        start: Temporal.ZonedDateTime.from(
          '2026-08-01T00:00:00+08:00[Asia/Shanghai]',
        ),
        end: Temporal.ZonedDateTime.from(
          '2026-09-01T00:00:00+08:00[Asia/Shanghai]',
        ),
      }),
    ).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });

  it('collapses a reversed range onto the start date', () => {
    const start = Temporal.ZonedDateTime.from(
      '2026-08-01T00:00:00+08:00[Asia/Shanghai]',
    );

    expect(
      toCalendarQueryRange({
        start,
        end: start,
      }),
    ).toEqual({ from: '2026-08-01', to: '2026-08-01' });
  });
});
