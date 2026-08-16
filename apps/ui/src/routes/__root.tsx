import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { RouteErrorComponent } from '@/components/RouteErrorComponent';
import { RouteNotFoundComponent } from '@/components/RouteNotFoundComponent';
import { Toaster } from '@/components/ui/toast';
import { queryClient } from '@/lib/query-client';
import '../styles.css';

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RouteErrorComponent,
  notFoundComponent: RouteNotFoundComponent,
});

function RootComponent() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}
