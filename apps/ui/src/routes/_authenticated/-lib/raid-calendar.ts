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

export const isRaidCalendarStatus = (
  status: string,
): status is RaidCalendarStatus =>
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

export const formatRaidDateTime = (iso: string): string => {
  const zoned = toShanghaiZonedDateTime(iso);
  return `${zoned.month}月${zoned.day}日 ${formatRaidClock(iso)}`;
};

export const UPCOMING_RAID_LOOKAHEAD_DAYS = 13;
export const UPCOMING_RAID_LIMIT = 5;

export const toUpcomingQueryRange = (
  now: Temporal.ZonedDateTime = Temporal.Now.zonedDateTimeISO(
    RAID_CALENDAR_TIMEZONE,
  ),
): { from: string; to: string } => {
  const from = now.toPlainDate();
  const to = from.add({ days: UPCOMING_RAID_LOOKAHEAD_DAYS });
  return { from: from.toString(), to: to.toString() };
};

const upcomingStatuses = new Set<RaidCalendarStatus>(['recruiting', 'ongoing']);

export const selectUpcomingRaids = (
  items: RaidRunCalendarItem[],
  now: Temporal.Instant = Temporal.Now.instant(),
  limit = UPCOMING_RAID_LIMIT,
): RaidRunCalendarItem[] =>
  items
    .filter(
      (item) =>
        isRaidCalendarStatus(item.status) && upcomingStatuses.has(item.status),
    )
    .filter((item) => {
      const start = Temporal.Instant.from(item.gatherTime ?? item.startTime);
      return Temporal.Instant.compare(start, now) >= 0;
    })
    .slice()
    .sort((a, b) =>
      Temporal.Instant.compare(
        Temporal.Instant.from(a.gatherTime ?? a.startTime),
        Temporal.Instant.from(b.gatherTime ?? b.startTime),
      ),
    )
    .slice(0, limit);

const startOfWeek = (
  date: Temporal.PlainDate,
  firstDayOfWeek: number,
): Temporal.PlainDate => {
  const delta = (date.dayOfWeek - firstDayOfWeek + 7) % 7;
  return date.subtract({ days: delta });
};

export const toVisibleMonthQueryRange = (
  now: Temporal.ZonedDateTime = Temporal.Now.zonedDateTimeISO(
    RAID_CALENDAR_TIMEZONE,
  ),
  firstDayOfWeek = 1,
): { from: string; to: string } => {
  const monthStart = now
    .withTimeZone(RAID_CALENDAR_TIMEZONE)
    .toPlainDate()
    .with({
      day: 1,
    });
  const monthEnd = monthStart.add({ months: 1 }).subtract({ days: 1 });
  const from = startOfWeek(monthStart, firstDayOfWeek);
  const to = startOfWeek(monthEnd, firstDayOfWeek).add({ days: 6 });

  return { from: from.toString(), to: to.toString() };
};

const isExclusiveMidnight = (zoned: Temporal.ZonedDateTime) =>
  zoned.hour === 0 &&
  zoned.minute === 0 &&
  zoned.second === 0 &&
  zoned.millisecond === 0;

export const toCalendarQueryRange = (range: {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
}): { from: string; to: string } => {
  const start = range.start.withTimeZone(RAID_CALENDAR_TIMEZONE);
  const end = range.end.withTimeZone(RAID_CALENDAR_TIMEZONE);
  const from = start.toPlainDate();
  const to = isExclusiveMidnight(end)
    ? end.toPlainDate().subtract({ days: 1 })
    : end.toPlainDate();

  if (Temporal.PlainDate.compare(from, to) > 0) {
    return { from: from.toString(), to: from.toString() };
  }

  return { from: from.toString(), to: to.toString() };
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

export const raidCalendarStatusLabel = (status: string): string =>
  isRaidCalendarStatus(status) ? raidCalendarColorMap[status].label : status;

export const applyMonthGridEventHostLayout = (host: HTMLElement) => {
  host.style.setProperty('box-sizing', 'border-box', 'important');
  host.style.setProperty('width', 'calc(100% - 8px)', 'important');
  host.style.setProperty('margin-inline', '4px', 'important');
};

export const raidCalendarEventClassName = (status: string): string => {
  if (status === 'recruiting') {
    return 'border-[#b4533a] bg-[#f6ddd4] text-[#4a1f14] dark:border-[#f0b3a2] dark:bg-[#7a3426] dark:text-[#fde8e0]';
  }

  if (status === 'ongoing') {
    return 'border-[#2563eb] bg-[#dbeafe] text-[#1e3a8a] dark:border-[#93c5fd] dark:bg-[#1e40af] dark:text-[#dbeafe]';
  }

  if (status === 'completed') {
    return 'border-[#16a34a] bg-[#dcfce7] text-[#14532d] dark:border-[#86efac] dark:bg-[#166534] dark:text-[#dcfce7]';
  }

  if (status === 'cancelled') {
    return 'border-[#9f1239] bg-[#ffe4e6] text-[#4c0519] dark:border-[#fda4af] dark:bg-[#881337] dark:text-[#ffe4e6]';
  }

  return '';
};
