import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminGameServerListItem } from '@/lib/api/admin/admin-game-servers-api';
import { GameServerEditDialogComponent } from '@/routes/_authenticated/admin/game-servers/-components/GameServerEditDialogComponent';

const gameServer: AdminGameServerListItem = {
  id: '1',
  serverId: 'mengjiangnan',
  zone: '电信一区',
  name: '梦江南',
  alias: ['梦岛'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('GameServerEditDialogComponent', () => {
  it('submits edited values and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GameServerEditDialogComponent
        gameServer={gameServer}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('名称'));
    await user.type(screen.getByLabelText('名称'), '绝代');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      serverId: 'mengjiangnan',
      zone: '电信一区',
      name: '绝代',
      alias: ['梦岛'],
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <GameServerEditDialogComponent
        gameServer={gameServer}
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form without a game server', () => {
    render(
      <GameServerEditDialogComponent
        gameServer={null}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });
});
