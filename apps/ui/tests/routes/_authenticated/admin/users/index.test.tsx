import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminBanUser,
  adminUnbanUser,
} = vi.hoisted(() => ({
  adminListUsers: vi.fn(),
  adminCreateUser: vi.fn(),
  adminUpdateUser: vi.fn(),
  adminDeleteUser: vi.fn(),
  adminBanUser: vi.fn(),
  adminUnbanUser: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-users-api', () => ({
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminBanUser,
  adminUnbanUser,
}));

const userItem = {
  id: 'user-1',
  name: 'Alice',
  emailMasked: 'a***@example.com',
  role: 'user',
  banned: false,
  banReason: null,
  banDate: null,
  lastLoginIp: '1.1.1.1',
  providers: ['credential'],
  createdAt: '2026-01-01 00:00:00',
};

describe('admin users route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListUsers.mockReset();
    adminCreateUser.mockReset();
    adminUpdateUser.mockReset();
    adminDeleteUser.mockReset();
    adminBanUser.mockReset();
    adminUnbanUser.mockReset();
    adminListUsers.mockResolvedValue({ items: [userItem], total: 1 });
  });

  it('lists users', async () => {
    await renderApp('/admin/users');
    expect(await screen.findByText('Alice')).toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/users');
    await screen.findByText('Alice');

    await user.type(screen.getByLabelText('用户名'), 'Ali');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListUsers).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Ali', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          name: undefined,
          email: undefined,
          page: 1,
        }),
      );
    });
  });

  it('shows a load error', async () => {
    adminListUsers.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/users');
    expect(
      await screen.findByText('加载用户列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates a user', async () => {
    const user = userEvent.setup();
    adminCreateUser.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/users');
    await screen.findByText('Alice');

    await user.click(screen.getByRole('button', { name: '新增用户' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('用户名'), 'Bob');
    await user.type(within(dialog).getByLabelText('邮箱'), 'bob@example.com');
    await user.type(within(dialog).getByLabelText('密码'), 'password1');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateUser).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '用户已创建' }),
      );
    });
  });

  it('edits, bans, unbans, and deletes users', async () => {
    const user = userEvent.setup();
    adminUpdateUser.mockResolvedValue({ id: 'user-1' });
    adminBanUser.mockResolvedValue({ id: 'user-1' });
    adminUnbanUser.mockResolvedValue({ id: 'user-1' });
    adminDeleteUser.mockResolvedValue(undefined);

    await renderApp('/admin/users');
    await screen.findByText('Alice');

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateUser).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '封禁' }));
    const banDialog = await screen.findByRole('dialog');
    await user.type(within(banDialog).getByLabelText('原因'), 'spam');
    await user.click(within(banDialog).getByRole('button', { name: '封禁' }));
    await waitFor(() => {
      expect(adminBanUser).toHaveBeenCalled();
    });

    adminListUsers.mockResolvedValue({
      items: [{ ...userItem, banned: true }],
      total: 1,
    });
    cleanup();
    await renderApp('/admin/users');
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '解封' }));
    const unbanConfirm = await screen.findByRole('alertdialog');
    await user.click(
      within(unbanConfirm).getByRole('button', { name: '解封' }),
    );
    await waitFor(() => {
      expect(adminUnbanUser).toHaveBeenCalledWith('user-1');
    });

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteUser).toHaveBeenCalledWith('user-1');
    });
  });

  it('toasts mutation failures', async () => {
    const user = userEvent.setup();
    adminCreateUser.mockRejectedValue(new Error('创建失败'));
    adminUpdateUser.mockRejectedValue(new Error('更新失败'));
    adminBanUser.mockRejectedValue(new Error('封禁失败'));
    adminUnbanUser.mockRejectedValue(new Error('解封失败'));
    adminDeleteUser.mockRejectedValue(new Error('删除失败'));

    await renderApp('/admin/users');
    await screen.findByText('Alice');

    await user.click(screen.getByRole('button', { name: '新增用户' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('用户名'), 'Bob');
    await user.type(
      within(createDialog).getByLabelText('邮箱'),
      'bob@example.com',
    );
    await user.type(within(createDialog).getByLabelText('密码'), 'password1');
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

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '更新失败' }),
      );
    });
    await user.click(within(editDialog).getByRole('button', { name: '取消' }));

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '封禁' }));
    const banDialog = await screen.findByRole('dialog');
    await user.type(within(banDialog).getByLabelText('原因'), 'spam');
    await user.click(within(banDialog).getByRole('button', { name: '封禁' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '封禁失败' }),
      );
    });
    await user.click(within(banDialog).getByRole('button', { name: '取消' }));

    adminListUsers.mockResolvedValue({
      items: [{ ...userItem, banned: true }],
      total: 1,
    });
    cleanup();
    await renderApp('/admin/users');
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '解封' }));
    const unbanConfirm = await screen.findByRole('alertdialog');
    await user.click(
      within(unbanConfirm).getByRole('button', { name: '解封' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '解封失败' }),
      );
    });

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '删除失败' }),
      );
    });
  });

  it('cancels unban and delete confirmations', async () => {
    const user = userEvent.setup();
    adminListUsers.mockResolvedValue({
      items: [{ ...userItem, banned: true }],
      total: 1,
    });
    await renderApp('/admin/users');
    expect(await screen.findByText('Alice')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '解封' }));
    const unbanConfirm = await screen.findByRole('alertdialog');
    await user.click(
      within(unbanConfirm).getByRole('button', { name: '取消' }),
    );
    expect(adminUnbanUser).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '删除' }));
    const deleteConfirm = await screen.findByRole('alertdialog');
    await user.click(
      within(deleteConfirm).getByRole('button', { name: '取消' }),
    );
    expect(adminDeleteUser).not.toHaveBeenCalled();
  });
});
