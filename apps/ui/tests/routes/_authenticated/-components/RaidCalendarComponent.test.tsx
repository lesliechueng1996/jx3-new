import { render, screen, waitFor } from '@testing-library/react';
import { Temporal } from 'temporal-polyfill';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '../../../helpers/render';

const { listRaidRunCalendar, eventsServiceSet } = vi.hoisted(() => ({
  listRaidRunCalendar: vi.fn(),
  eventsServiceSet: vi.fn(),
}));

vi.mock('@/lib/api/raid-runs-api', () => ({
  raidRunCalendarQueryKey: (from: string, to: string) =>
    ['raid-run-calendar', from, to] as const,
  listRaidRunCalendar,
}));

vi.mock('@schedule-x/calendar', () => ({
  createViewMonthGrid: () => ({ name: 'month-grid' }),
  createViewWeek: () => ({ name: 'week' }),
}));

vi.mock('@schedule-x/events-service', () => ({
  createEventsServicePlugin: () => ({ set: eventsServiceSet }),
}));

vi.mock('@schedule-x/theme-default/dist/index.css', () => ({}));

vi.mock('@schedule-x/react', async () => {
  const { useEffect } = await import('react');
  const { Temporal } = await import('temporal-polyfill');

  return {
    useCalendarApp: (config: {
      callbacks?: {
        onRangeUpdate?: (range: {
          start: Temporal.ZonedDateTime;
          end: Temporal.ZonedDateTime;
        }) => void;
      };
    }) => {
      useEffect(() => {
        config.callbacks?.onRangeUpdate?.({
          start: Temporal.ZonedDateTime.from(
            '2026-08-01T00:00:00+08:00[Asia/Shanghai]',
          ),
          end: Temporal.ZonedDateTime.from(
            '2026-09-01T00:00:00+08:00[Asia/Shanghai]',
          ),
        });
      }, []);
      return {};
    },
    ScheduleXCalendar: () => <div data-testid="schedule-x-calendar" />,
  };
});

describe('RaidCalendarComponent', () => {
  beforeEach(() => {
    listRaidRunCalendar.mockReset();
    eventsServiceSet.mockReset();
    listRaidRunCalendar.mockResolvedValue({ items: [] });
  });

  it('loads calendar events for the visible range', async () => {
    listRaidRunCalendar.mockResolvedValue({
      items: [
        {
          id: 'run-1',
          name: '周六团',
          status: 'recruiting',
          gatherTime: '2026-08-22T12:00:00.000Z',
          startTime: '2026-08-22T13:00:00.000Z',
          endTime: '2026-08-22T16:00:00.000Z',
          dungeonName: '25人英雄河阳之战',
        },
      ],
    });

    const RaidCalendarComponent = (
      await import('@/routes/_authenticated/-components/RaidCalendarComponent')
    ).default;
    renderWithQueryClient(<RaidCalendarComponent />);

    expect(screen.getByText('开团日历')).toBeInTheDocument();
    expect(await screen.findByText('加载中…')).toBeInTheDocument();

    await waitFor(() => {
      expect(listRaidRunCalendar).toHaveBeenCalledWith({
        from: '2026-08-01',
        to: '2026-08-31',
      });
    });

    await waitFor(() => {
      expect(eventsServiceSet).toHaveBeenCalled();
    });

    expect(
      await screen.findByText('按月或按周查看已发布的开团'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('schedule-x-calendar')).toBeInTheDocument();
  });

  it('shows an error when the calendar query fails', async () => {
    listRaidRunCalendar.mockRejectedValue(new Error('boom'));

    const RaidCalendarComponent = (
      await import('@/routes/_authenticated/-components/RaidCalendarComponent')
    ).default;
    renderWithQueryClient(<RaidCalendarComponent />);

    expect(
      await screen.findByText('加载开团日历失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('renders month and week event content', async () => {
    const { RaidMonthGridEventComponent, RaidWeekTimeGridEventComponent } =
      await import('@/routes/_authenticated/-components/RaidCalendarComponent');
    const calendarEvent = {
      id: 'run-1',
      title: '周六团',
      start: Temporal.ZonedDateTime.from(
        '2026-08-22T20:00:00+08:00[Asia/Shanghai]',
      ),
      end: Temporal.ZonedDateTime.from(
        '2026-08-23T00:00:00+08:00[Asia/Shanghai]',
      ),
      calendarId: 'recruiting' as const,
      raidGatherTime: '2026-08-22T12:00:00.000Z',
      raidStartTime: '2026-08-22T13:00:00.000Z',
      raidEndTime: null,
      dungeonName: '25人英雄河阳之战',
    };

    render(<RaidMonthGridEventComponent calendarEvent={calendarEvent} />);
    expect(screen.getByText('周六团')).toBeInTheDocument();

    render(<RaidWeekTimeGridEventComponent calendarEvent={calendarEvent} />);
    expect(screen.getByText('集合 20:00')).toBeInTheDocument();
    expect(screen.getByText('进本 21:00')).toBeInTheDocument();
    expect(screen.getByText('预计结束 —')).toBeInTheDocument();
  });
});
