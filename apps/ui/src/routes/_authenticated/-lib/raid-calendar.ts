import type { CalendarEvent } from '@schedule-x/calendar';
import { Temporal } from 'temporal-polyfill';
import type { RaidRunCalendarItem } from '@/lib/api/raid-runs-api';

export const RAID_CALENDAR_TIMEZONE = 'Asia/Shanghai';

export const raidCalendarStatuses = [
  'recruiting',
  'ongoing',
  'completed',
  'cancelled',
] as const;

export type RaidCalendarStatus = (typeof raidCalendarStatuses)[number];

export type RaidCalendarMappedEvent = CalendarEvent & {
  calendarId: RaidCalendarStatus;
  raidGatherTime: string | null;
  raidStartTime: string;
  raidEndTime: string | null;
  dungeonName: string | null;
};

const isRaidCalendarStatus = (status: string): status is RaidCalendarStatus =>
  raidCalendarStatuses.some((value) => value === status);

export const toShanghaiZonedDateTime = (iso: string) =>
  Temporal.Instant.from(iso).toZonedDateTimeISO(RAID_CALENDAR_TIMEZONE);

export const formatRaidClock = (iso: string | null): string => {
  if (iso == null) {
    return '—';
  }

  const zoned = toShanghaiZonedDateTime(iso);
  return `${String(zoned.hour).padStart(2, '0')}:${String(zoned.minute).padStart(2, '0')}`;
};

export const toCalendarQueryRange = (range: {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
}): { from: string; to: string } => {
  const from = range.start.toPlainDate().toString();
  const to = range.end.subtract({ seconds: 1 }).toPlainDate().toString();

  if (from > to) {
    return { from, to: from };
  }

  return { from, to };
};

const eventEnd = (
  start: Temporal.ZonedDateTime,
  endTime: string | null,
  startTime: string,
): Temporal.ZonedDateTime => {
  const end = toShanghaiZonedDateTime(endTime ?? startTime);

  if (Temporal.Instant.compare(end.toInstant(), start.toInstant()) <= 0) {
    return start.add({ minutes: 30 });
  }

  return end;
};

export const toCalendarEvents = (
  items: RaidRunCalendarItem[],
): RaidCalendarMappedEvent[] =>
  items.flatMap((item) => {
    if (!isRaidCalendarStatus(item.status)) {
      return [];
    }

    const start = toShanghaiZonedDateTime(item.gatherTime ?? item.startTime);

    return [
      {
        id: item.id,
        title: item.name,
        start,
        end: eventEnd(start, item.endTime, item.startTime),
        calendarId: item.status,
        raidGatherTime: item.gatherTime,
        raidStartTime: item.startTime,
        raidEndTime: item.endTime,
        dungeonName: item.dungeonName,
      },
    ];
  });

export const raidCalendarColorMap = {
  recruiting: {
    colorName: 'recruiting',
    label: '招募中',
    lightColors: {
      main: '#b4533a',
      container: '#f6ddd4',
      onContainer: '#4a1f14',
    },
    darkColors: {
      main: '#f0b3a2',
      container: '#7a3426',
      onContainer: '#fde8e0',
    },
  },
  ongoing: {
    colorName: 'ongoing',
    label: '进行中',
    lightColors: {
      main: '#2563eb',
      container: '#dbeafe',
      onContainer: '#1e3a8a',
    },
    darkColors: {
      main: '#93c5fd',
      container: '#1e40af',
      onContainer: '#dbeafe',
    },
  },
  completed: {
    colorName: 'completed',
    label: '已完成',
    lightColors: {
      main: '#16a34a',
      container: '#dcfce7',
      onContainer: '#14532d',
    },
    darkColors: {
      main: '#86efac',
      container: '#166534',
      onContainer: '#dcfce7',
    },
  },
  cancelled: {
    colorName: 'cancelled',
    label: '已取消',
    lightColors: {
      main: '#9f1239',
      container: '#ffe4e6',
      onContainer: '#4c0519',
    },
    darkColors: {
      main: '#fda4af',
      container: '#881337',
      onContainer: '#ffe4e6',
    },
  },
} as const;
