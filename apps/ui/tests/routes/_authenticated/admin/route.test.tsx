import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../helpers/render';
import { adminSession, userSession } from '../../../helpers/session';

describe('admin layout', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
  });

  it('allows admins through', async () => {
    await renderApp('/admin/idioms');
    expect(
      await screen.findByRole('heading', { name: '成语管理' }),
    ).toBeInTheDocument();
  });

  it('sends non-admins to forbidden', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);

    const { router } = await renderApp('/admin/idioms');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/forbidden');
    });
  });
});
