import { createFileRoute } from '@tanstack/react-router';
import RaidRunPage from './-components/RaidRunPage';

export const Route = createFileRoute('/_authenticated/raid-run/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <RaidRunPage />;
}
