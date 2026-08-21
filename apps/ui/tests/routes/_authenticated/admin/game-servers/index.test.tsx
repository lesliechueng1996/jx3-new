import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListGameServers,
  adminCreateGameServer,
  adminUpdateGameServer,
  adminDeleteGameServer,
  adminSyncGameServers,
} = vi.hoisted(() => ({
  adminListGameServers: vi.fn(),
  adminCreateGameServer: vi.fn(),
  adminUpdateGameServer: vi.fn(),
  adminDeleteGameServer: vi.fn(),
  adminSyncGameServers: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-game-servers-api', () => ({
  adminListGameServers,
  adminCreateGameServer,
  adminUpdateGameServer,
  adminDeleteGameServer,
  adminSyncGameServers,
}));

const gameServerItem = {
  id: 'server-1',
  serverId: 'mengjiangnan',
  zone: '电信一区',
  name: '梦江南',
  alias: ['梦岛'],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

describe('admin game servers route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListGameServers.mockReset();
    adminCreateGameServer.mockReset();
    adminUpdateGameServer.mockReset();
    adminDeleteGameServer.mockReset();
    adminSyncGameServers.mockReset();
    adminListGameServers.mockResolvedValue({ items: [gameServerItem] });
    adminSyncGameServers.mockResolvedValue({
      updatedCount: 1,
      insertedCount: 2,
    });
  });

  it('lists game servers', async () => {
    await renderApp('/admin/game-servers');
    expect(await screen.findByText('梦江南')).toBeInTheDocument();
  });

  it('shows a load error', async () => {
    adminListGameServers.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/game-servers');
    expect(
      await screen.findByText('加载区服列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates a game server', async () => {
    const user = userEvent.setup();
    adminCreateGameServer.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/game-servers');
    await screen.findByText('梦江南');

    await user.click(screen.getByRole('button', { name: '新增区服' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('服务器 ID'), 'aodai');
    await user.type(within(dialog).getByLabelText('大区'), '电信一区');
    await user.type(within(dialog).getByLabelText('名称'), '绝代');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateGameServer).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '区服已创建' }),
      );
    });
  });

  it('edits and deletes game servers', async () => {
    const user = userEvent.setup();
    adminUpdateGameServer.mockResolvedValue({ id: 'server-1' });
    adminDeleteGameServer.mockResolvedValue(undefined);

    await renderApp('/admin/game-servers');
    await screen.findByText('梦江南');

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateGameServer).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteGameServer).toHaveBeenCalledWith('server-1');
    });
  });

  it('toasts mutation failures', async () => {
    const user = userEvent.setup();
    adminCreateGameServer.mockRejectedValue(new Error('创建失败'));
    adminUpdateGameServer.mockRejectedValue(new Error('更新失败'));
    adminDeleteGameServer.mockRejectedValue(new Error('删除失败'));

    await renderApp('/admin/game-servers');
    await screen.findByText('梦江南');

    await user.click(screen.getByRole('button', { name: '新增区服' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('服务器 ID'), 'aodai');
    await user.type(within(createDialog).getByLabelText('大区'), '电信一区');
    await user.type(within(createDialog).getByLabelText('名称'), '绝代');
    await user.click(
      within(createDialog).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '创建失败' }),
      );
    });
    await user.click(
      within(createDialog).getByRole('button', { name: '取消' }),
    );

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '更新失败' }),
      );
    });
    await user.click(within(editDialog).getByRole('button', { name: '取消' }));

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '删除失败' }),
      );
    });
  });

  it('cancels a delete confirmation', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/game-servers');
    await screen.findByText('梦江南');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminDeleteGameServer).not.toHaveBeenCalled();
  });

  it('syncs game servers and toasts the counts', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/game-servers');
    await screen.findByText('梦江南');

    await user.click(screen.getByRole('button', { name: '同步服务器' }));
    await waitFor(() => {
      expect(adminSyncGameServers).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '同步完成：更新 1 条，新增 2 条',
        }),
      );
    });
  });

  it('shows a pending spinner while syncing', async () => {
    const user = userEvent.setup();
    let resolveSync: (value: {
      updatedCount: number;
      insertedCount: number;
    }) => void = () => undefined;
    adminSyncGameServers.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSync = resolve;
        }),
    );

    await renderApp('/admin/game-servers');
    await screen.findByText('梦江南');
    await user.click(screen.getByRole('button', { name: '同步服务器' }));

    expect(
      await screen.findByRole('button', { name: /Loading同步服务器/ }),
    ).toBeDisabled();

    resolveSync({ updatedCount: 0, insertedCount: 0 });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '同步服务器' })).toBeEnabled();
    });
  });

  it('toasts a sync failure', async () => {
    const user = userEvent.setup();
    adminSyncGameServers.mockRejectedValue(new Error('同步失败'));
    await renderApp('/admin/game-servers');
    await screen.findByText('梦江南');

    await user.click(screen.getByRole('button', { name: '同步服务器' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '同步失败' }),
      );
    });
  });
});
