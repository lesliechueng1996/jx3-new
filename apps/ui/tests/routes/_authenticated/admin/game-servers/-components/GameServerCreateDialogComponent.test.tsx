import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameServerCreateDialogComponent } from '@/routes/_authenticated/admin/game-servers/-components/GameServerCreateDialogComponent';

describe('GameServerCreateDialogComponent', () => {
  it('submits a new game server and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GameServerCreateDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('服务器 ID'), 'mengjiangnan');
    await user.type(screen.getByLabelText('大区'), '电信一区');
    await user.type(screen.getByLabelText('名称'), '梦江南');
    await user.type(screen.getByLabelText('别名'), '梦岛，绝代');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      serverId: 'mengjiangnan',
      zone: '电信一区',
      name: '梦江南',
      alias: ['梦岛', '绝代'],
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <GameServerCreateDialogComponent
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form when closed', () => {
    render(
      <GameServerCreateDialogComponent
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
  });
});
