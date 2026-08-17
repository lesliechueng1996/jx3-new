import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../helpers/render';
import { adminSession } from '../../helpers/session';

describe('home route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
  });

  it('shows the overview copy', async () => {
    await renderApp('/');
    expect(await screen.findByText('欢迎回来')).toBeInTheDocument();
    expect(
      screen.getByText(/从左侧菜单进入成语管理与游戏辅助/),
    ).toBeInTheDocument();
  });
});
