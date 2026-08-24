import { createFileRoute } from '@tanstack/react-router';
import RaidRunPage from './-components/RaidRunPage';

export const Route = createFileRoute('/_authenticated/raid-run/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <RaidRunPage raidRunId={id} />;
}
