import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }

    return { user: session.user };
  },
});

function RouteComponent() {
  return <Outlet />;
}
