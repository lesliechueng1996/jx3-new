import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminGameServerListItem } from '@/lib/api/admin/admin-game-servers-api';
import { GameServerTableComponent } from '@/routes/_authenticated/admin/game-servers/-components/GameServerTableComponent';

const gameServer: AdminGameServerListItem = {
  id: '1',
  serverId: 'mengjiangnan',
  zone: '电信一区',
  name: '梦江南',
  alias: ['梦岛'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('GameServerTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <GameServerTableComponent
        items={[]}
        pendingGameServerId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无区服数据')).toBeInTheDocument();
  });

  it('edits and deletes a row, and hides missing optional values', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <GameServerTableComponent
        items={[
          gameServer,
          {
            ...gameServer,
            id: '2',
            name: '绝代',
            serverId: 'aodai',
            alias: [],
          },
        ]}
        pendingGameServerId="2"
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('梦江南')).toBeInTheDocument();
    expect(screen.getByText('梦岛')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(gameServer);
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(gameServer);
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();
  });

  it('shows a loading overlay', () => {
    render(
      <GameServerTableComponent
        items={[]}
        isLoading
        pendingGameServerId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
