import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteErrorComponent } from '@/components/RouteErrorComponent';
import { sessionQueryKey } from '@/lib/auth-session';
import { queryClient } from '@/lib/query-client';

const invalidate = vi.fn(async () => undefined);

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useRouter: () => ({ invalidate }),
    Link: ({
      to,
      children,
      ...props
    }: {
      to: string;
      children?: ReactNode;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function renderError(error: unknown) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouteErrorComponent error={error as Error} reset={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('RouteErrorComponent', () => {
  beforeEach(() => {
    invalidate.mockClear();
  });

  it('shows the network error copy', () => {
    renderError(new TypeError('Failed to fetch'));
    expect(screen.getByText('无法连接服务器')).toBeInTheDocument();
    expect(screen.getByText('503')).toBeInTheDocument();
  });

  it('shows a custom error message', () => {
    renderError(new Error('数据库超时'));
    expect(screen.getByText('页面出了点问题')).toBeInTheDocument();
    expect(screen.getByText('数据库超时')).toBeInTheDocument();
  });

  it('falls back when the error is not an Error instance', () => {
    renderError('weird');
    expect(
      screen.getByText('发生了意外错误。请重试，若仍无法恢复可刷新页面。'),
    ).toBeInTheDocument();
  });

  it('retries by invalidating the router', async () => {
    const user = userEvent.setup();
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');
    renderError(new Error('boom'));

    await user.click(screen.getByRole('button', { name: /重试/ }));
    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: sessionQueryKey });
      expect(invalidate).toHaveBeenCalled();
    });
  });
});
