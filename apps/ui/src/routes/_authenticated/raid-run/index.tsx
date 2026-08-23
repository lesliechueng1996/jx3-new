import { createFileRoute } from '@tanstack/react-router';
import RaidMemberPanel from './-components/RaidMemberPanel';
import RaidRunInfo from './-components/RaidRunInfo';
import RaidTeamLayout from './-components/RaidTeamLayout';

export const Route = createFileRoute('/_authenticated/raid-run/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex w-full min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">开团</h1>
        <p className="text-sm text-muted-foreground">创建游戏副本开团活动。</p>
      </div>

      <div className="flex w-full min-w-0 items-start gap-4">
        <RaidRunInfo className="w-72 shrink-0" />
        <RaidTeamLayout className="min-w-0 flex-1" />
        <RaidMemberPanel className="w-72 shrink-0" />
      </div>
    </section>
  );
}
