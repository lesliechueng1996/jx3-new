import { createFileRoute } from '@tanstack/react-router';
import RaidRunInfo from './-components/RaidRunInfo';

export const Route = createFileRoute('/_authenticated/raid-run/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">开团</h1>
        <p className="text-sm text-muted-foreground">创建游戏副本开团活动。</p>
      </div>

      <RaidRunInfo className="w-96" />
    </section>
  );
}
