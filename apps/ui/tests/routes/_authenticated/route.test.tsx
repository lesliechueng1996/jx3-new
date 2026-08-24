import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../helpers/render';
import { adminSession } from '../../helpers/session';

describe('authenticated layout', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
  });

  it('redirects guests to login with the original path', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: null,
    } as never);

    const { router } = await renderApp('/game-assist/guess-idiom');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
      expect(router.state.location.search).toEqual(
        expect.objectContaining({ redirect: '/game-assist/guess-idiom' }),
      );
    });
  });

  it('renders the shell for a signed-in user', async () => {
    await renderApp('/');
    expect(await screen.findByText('欢迎回来')).toBeInTheDocument();
    expect(screen.getByText('控制台')).toBeInTheDocument();
    expect(document.title).toBe('概览 · 四堆专用');
  });
});
