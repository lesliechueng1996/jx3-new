import 'temporal-polyfill/global';
import { createViewMonthGrid, createViewWeek } from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react';
import '@schedule-x/theme-default/dist/index.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import ErrorAlert from '@/components/ErrorAlert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  listRaidRunCalendar,
  raidRunCalendarQueryKey,
} from '@/lib/api/raid-runs-api';
import { cn } from '@/lib/utils';
import {
  applyMonthGridEventHostLayout,
  formatRaidClock,
  RAID_CALENDAR_TIMEZONE,
  type RaidCalendarMappedEvent,
  raidCalendarColorMap,
  raidCalendarEventClassName,
  toCalendarEvents,
  toCalendarQueryRange,
  toVisibleMonthQueryRange,
} from '../-lib/raid-calendar';

type CalendarEventProps = {
  calendarEvent: RaidCalendarMappedEvent;
};

export const RaidMonthGridEventComponent = ({
  calendarEvent,
}: CalendarEventProps) => (
  <div
    className={cn(
      'block h-full w-full min-w-0 truncate rounded-sm border-l-2 px-1 text-xs',
      raidCalendarEventClassName(calendarEvent.calendarId),
    )}
    ref={(element) => {
      if (element?.parentElement) {
        applyMonthGridEventHostLayout(element.parentElement);
      }
    }}
    title={calendarEvent.title}
  >
    {calendarEvent.title}
  </div>
);

export const RaidWeekTimeGridEventComponent = ({
  calendarEvent,
}: CalendarEventProps) => (
  <div
    className={cn(
      'flex h-full min-h-0 flex-col gap-0.5 overflow-hidden rounded-sm border-l-2 px-1 py-0.5 text-xs',
      raidCalendarEventClassName(calendarEvent.calendarId),
    )}
  >
    <div className="truncate font-medium">{calendarEvent.title}</div>
    <div className="truncate text-[10px] opacity-80">
      集合 {formatRaidClock(calendarEvent.raidGatherTime)}
    </div>
    <div className="truncate text-[10px] opacity-80">
      进本 {formatRaidClock(calendarEvent.raidStartTime)}
    </div>
    <div className="truncate text-[10px] opacity-80">
      预计结束 {formatRaidClock(calendarEvent.raidEndTime)}
    </div>
  </div>
);

const RaidCalendarComponent = () => {
  const [range, setRange] = useState(toVisibleMonthQueryRange);
  const [eventsService] = useState(() => createEventsServicePlugin());
  const [monthView] = useState(() => createViewMonthGrid());
  const [weekView] = useState(() => createViewWeek());

  const calendarQuery = useQuery({
    queryKey: raidRunCalendarQueryKey(range.from, range.to),
    queryFn: () => listRaidRunCalendar(range),
  });

  const calendar = useCalendarApp({
    views: [monthView, weekView],
    defaultView: monthView.name,
    locale: 'zh-CN',
    timezone: RAID_CALENDAR_TIMEZONE,
    firstDayOfWeek: 1,
    isResponsive: false,
    dayBoundaries: {
      start: '12:00',
      end: '02:00',
    },
    weekOptions: {
      nDays: 7,
      gridStep: 30,
      eventOverlap: true,
    },
    monthGridOptions: {
      nEventsPerDay: 2,
    },
    calendars: raidCalendarColorMap,
    plugins: [eventsService],
    callbacks: {
      onRangeUpdate: (nextRange) => {
        setRange(toCalendarQueryRange(nextRange));
      },
    },
  });

  useEffect(() => {
    if (!calendarQuery.data) {
      return;
    }

    eventsService.set(toCalendarEvents(calendarQuery.data.items));
  }, [calendarQuery.data, eventsService]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>开团日历</CardTitle>
        <CardDescription>
          {calendarQuery.isPending ? '加载中…' : '按月或按周查看已发布的开团'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {calendarQuery.isError ? (
          <ErrorAlert
            title="错误"
            description="加载开团日历失败，请稍后重试。"
          />
        ) : null}
        <div
          className={cn(
            'h-120 w-full overflow-hidden',
            '[&_.sx-react-calendar-wrapper]:h-full [&_.sx-react-calendar-wrapper]:w-full',
            '[&_.sx__view-container]:min-h-0 [&_.sx__view-container]:overflow-hidden',
            '[&_.sx__month-grid-wrapper]:min-h-0',
            '[&_.sx__month-grid-week]:min-h-0',
            '[&_.sx__month-grid-cell]:h-4',
          )}
        >
          <ScheduleXCalendar
            calendarApp={calendar}
            customComponents={{
              monthGridEvent: RaidMonthGridEventComponent,
              timeGridEvent: RaidWeekTimeGridEventComponent,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default RaidCalendarComponent;
