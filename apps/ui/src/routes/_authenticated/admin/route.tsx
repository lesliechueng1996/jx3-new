import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { ROLE_ADMIN } from '@/lib/auth-client';

export const Route = createFileRoute('/_authenticated/admin')({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    const { user } = context;

    if (user.role !== ROLE_ADMIN) {
      throw redirect({
        to: '/forbidden',
      });
    }
  },
});

function RouteComponent() {
  return <Outlet />;
}
