import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminUserListItem } from '@/lib/api/admin/admin-users-api';
import { UserTableComponent } from '@/routes/_authenticated/admin/users/-components/UserTableComponent';

const userItem: AdminUserListItem = {
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

describe('UserTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <UserTableComponent
        items={[]}
        actorId="admin-1"
        pendingUserId={null}
        onEdit={vi.fn()}
        onBan={vi.fn()}
        onUnban={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无用户数据')).toBeInTheDocument();
  });

  it('edits, bans, and deletes a regular user', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onBan = vi.fn();
    const onDelete = vi.fn();

    render(
      <UserTableComponent
        items={[userItem]}
        actorId="admin-1"
        pendingUserId={null}
        onEdit={onEdit}
        onBan={onBan}
        onUnban={vi.fn()}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('密码')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '编辑' }));
    expect(onEdit).toHaveBeenCalledWith(userItem);

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '封禁' }));
    expect(onBan).toHaveBeenCalledWith(userItem);

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '删除' }));
    expect(onDelete).toHaveBeenCalledWith(userItem);
  });

  it('unbans a banned user and hides missing optional values', async () => {
    const user = userEvent.setup();
    const onUnban = vi.fn();
    render(
      <UserTableComponent
        items={[
          {
            ...userItem,
            id: 'user-2',
            name: 'Bob',
            role: null,
            banned: true,
            lastLoginIp: null,
            providers: [],
          },
        ]}
        actorId="admin-1"
        pendingUserId={null}
        onEdit={vi.fn()}
        onBan={vi.fn()}
        onUnban={onUnban}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('未设置')).toBeInTheDocument();
    expect(screen.getByText('已封禁')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '解封' }));
    expect(onUnban).toHaveBeenCalled();
  });

  it('shows a loading overlay and disables pending actions', () => {
    render(
      <UserTableComponent
        items={[
          {
            ...userItem,
            id: 'admin-2',
            name: 'Other',
            role: 'admin',
          },
        ]}
        actorId="admin-1"
        isLoading
        pendingUserId="admin-2"
        onEdit={vi.fn()}
        onBan={vi.fn()}
        onUnban={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('加载中...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '操作' })).toBeDisabled();
  });

  it('disables ban and delete for another admin', async () => {
    const user = userEvent.setup();
    render(
      <UserTableComponent
        items={[
          {
            ...userItem,
            id: 'admin-2',
            name: 'Other',
            role: 'admin',
          },
        ]}
        actorId="admin-1"
        pendingUserId={null}
        onEdit={vi.fn()}
        onBan={vi.fn()}
        onUnban={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '操作' }));
    const banItem = await screen.findByRole('menuitem', { name: '封禁' });
    const deleteItem = screen.getByRole('menuitem', { name: '删除' });
    expect(banItem).toHaveAttribute('aria-disabled', 'true');
    expect(deleteItem).toHaveAttribute('aria-disabled', 'true');
  });
});
