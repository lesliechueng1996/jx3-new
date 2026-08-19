import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminUserListItem } from '@/lib/api/admin/admin-users-api';
import { UserEditDialogComponent } from '@/routes/_authenticated/admin/users/-components/UserEditDialogComponent';

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

describe('UserEditDialogComponent', () => {
  it('submits name and optional fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <UserEditDialogComponent
        user={userItem}
        actorId="admin-1"
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('用户名'));
    await user.type(screen.getByLabelText('用户名'), 'Alicia');
    await user.type(screen.getByLabelText('邮箱'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Alicia',
      email: 'new@example.com',
      password: undefined,
      role: 'user',
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables role when editing self and maps a null role to user', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <UserEditDialogComponent
        user={{ ...userItem, id: 'admin-1', role: null }}
        actorId="admin-1"
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('button', { name: '管理员' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'user' }),
    );
  });

  it('keeps an admin role when editing another admin', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <UserEditDialogComponent
        user={{ ...userItem, role: 'admin' }}
        actorId="admin-1"
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' }),
    );
  });

  it('shows a pending spinner', () => {
    render(
      <UserEditDialogComponent
        user={userItem}
        actorId="admin-1"
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form without a user', () => {
    render(
      <UserEditDialogComponent
        user={null}
        actorId="admin-1"
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('用户名')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });
});
