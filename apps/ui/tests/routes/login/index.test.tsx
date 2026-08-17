import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../helpers/render';
import { adminSession } from '../../helpers/session';

describe('login route', () => {
  beforeEach(() => {
    vi.mocked(toast.add).mockClear();
    vi.mocked(authClient.getSession).mockResolvedValue({ data: null } as never);
    vi.mocked(authClient.signIn.email).mockReset();
  });

  it('renders the login form when logged out', async () => {
    await renderApp('/login');
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  it('redirects an existing session to the safe redirect path', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);

    const { router } = await renderApp('/login?redirect=/admin/idioms');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin/idioms');
    });
  });

  it('signs in and navigates home', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.email).mockImplementation(async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: adminSession,
      } as never);
      return {
        data: { user: adminSession.user },
        error: null,
      } as never;
    });

    const { router } = await renderApp('/login');
    await user.type(screen.getByLabelText('邮箱'), 'admin@example.com');
    await user.type(screen.getByLabelText('密码'), 'password1');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('maps 401 to a Chinese error', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      data: null,
      error: { status: 401, message: 'Unauthorized' },
    } as never);

    await renderApp('/login');
    await user.type(screen.getByLabelText('邮箱'), 'admin@example.com');
    await user.type(screen.getByLabelText('密码'), 'password1');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '登录失败',
          description: '邮箱或密码错误',
        }),
      );
    });
  });

  it('shows the API error message for other failures', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      data: null,
      error: { status: 500, message: '服务不可用' },
    } as never);

    await renderApp('/login');
    await user.type(screen.getByLabelText('邮箱'), 'admin@example.com');
    await user.type(screen.getByLabelText('密码'), 'password1');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '服务不可用' }),
      );
    });
  });
});
