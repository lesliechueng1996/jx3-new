import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { type RenderOptions, render, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { expect } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { routeTree } from '@/routeTree.gen';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { path?: string },
) {
  const { path = '/', ...renderOptions } = options ?? {};
  const queryClient = createQueryClient();

  const rootRoute = createRootRoute({
    errorComponent: ({ error }) => (
      <pre data-testid="router-error">{String(error)}</pre>
    ),
    component: () => (
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>{ui}</SidebarProvider>
      </QueryClientProvider>
    ),
  });

  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  const view = render(<RouterProvider router={router} />, renderOptions);

  return {
    ...view,
    queryClient,
    router,
  };
}

export function renderWithQueryClient(ui: ReactElement) {
  const queryClient = createQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper }),
    queryClient,
  };
}

export async function renderApp(initialPath: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  const view = render(<RouterProvider router={router} />);
  await waitFor(() => {
    expect(router.state.isLoading).toBe(false);
  });

  return {
    ...view,
    router,
  };
}
