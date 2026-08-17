import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { AppHeaderComponent } from '@/routes/_authenticated/-components/AppHeaderComponent';
import { adminSession, userSession } from '../../../helpers/session';

const navigate = vi.fn();
const { clearSessionQuery } = vi.hoisted(() => ({
  clearSessionQuery: vi.fn(),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/lib/auth-session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth-session')>();
  return {
    ...actual,
    clearSessionQuery,
  };
});

function renderHeader(user: {
  name: string;
  email: string;
  image?: string | null;
}) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SidebarProvider>
        <AppHeaderComponent user={user} />
      </SidebarProvider>
    </QueryClientProvider>,
  );
}

describe('AppHeaderComponent', () => {
  beforeEach(() => {
    clearSessionQuery.mockClear();
    navigate.mockClear();
    vi.mocked(toast.add).mockClear();
    vi.mocked(authClient.signOut).mockReset();
  });

  it('signs out and navigates to login', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signOut).mockResolvedValue({ error: null } as never);
    renderHeader(adminSession.user);

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('退出登录'));
    await waitFor(() => {
      expect(clearSessionQuery).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith({ to: '/login' });
    });
  });

  it('toasts when sign-out fails', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signOut).mockResolvedValue({
      error: { message: '网络错误' },
    } as never);
    renderHeader(userSession.user);

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('退出登录'));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '退出失败',
          description: '网络错误',
        }),
      );
    });
  });

  it('uses a fallback initial and error message', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signOut).mockResolvedValue({
      error: {},
    } as never);
    renderHeader({ name: '', email: '', image: null });

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('退出登录'));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '退出登录失败' }),
      );
    });
  });
});
