import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CalendarClockIcon } from 'lucide-react';
import { Temporal } from 'temporal-polyfill';
import ErrorAlert from '@/components/ErrorAlert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  listRaidRunCalendar,
  raidRunCalendarQueryKey,
} from '@/lib/api/raid-runs-api';
import {
  formatRaidDateTime,
  RAID_CALENDAR_TIMEZONE,
  raidCalendarStatusLabel,
  selectUpcomingRaids,
  toUpcomingQueryRange,
} from '../-lib/raid-calendar';

const UpcomingRaidsComponent = () => {
  const range = toUpcomingQueryRange(
    Temporal.Now.zonedDateTimeISO(RAID_CALENDAR_TIMEZONE),
  );
  const upcomingQuery = useQuery({
    queryKey: raidRunCalendarQueryKey(range.from, range.to),
    queryFn: () => listRaidRunCalendar(range),
  });
  const items = upcomingQuery.data
    ? selectUpcomingRaids(upcomingQuery.data.items)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>即将开团</CardTitle>
        <CardDescription>未来两周内招募中或进行中的团</CardDescription>
        <CardAction>
          <Button
            nativeButton={false}
            render={<Link to="/raid-run" />}
            size="sm"
            variant="outline"
          >
            去开团
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {upcomingQuery.isError ? (
          <ErrorAlert
            title="错误"
            description="加载即将开团失败，请稍后重试。"
          />
        ) : null}
        {upcomingQuery.isPending ? (
          <div
            aria-label="加载即将开团"
            className="flex flex-col gap-3"
            role="status"
          >
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : null}
        {upcomingQuery.isSuccess && items.length === 0 ? (
          <Empty className="border-0 p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarClockIcon />
              </EmptyMedia>
              <EmptyTitle>暂无即将开始的团</EmptyTitle>
              <EmptyDescription>近两周还没有已发布的开团。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {items.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {items.map((item) => {
              const when = formatRaidDateTime(
                item.gatherTime ?? item.startTime,
              );
              const statusLabel = raidCalendarStatusLabel(item.status);

              return (
                <li key={item.id}>
                  <Link
                    className="flex flex-col gap-1 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                    params={{ id: item.id }}
                    to="/raid-run/$id"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate font-medium">{item.name}</span>
                      <Badge variant="secondary">{statusLabel}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.dungeonName
                        ? `${item.dungeonName} · ${when}`
                        : when}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default UpcomingRaidsComponent;
