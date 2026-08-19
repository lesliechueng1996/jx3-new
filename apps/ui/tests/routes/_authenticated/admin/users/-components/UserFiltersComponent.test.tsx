import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserFiltersComponent } from '@/routes/_authenticated/admin/users/-components/UserFiltersComponent';
import type { UsersSearch } from '@/routes/_authenticated/admin/users/-lib/users-schema';

const filters: UsersSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  email: 'old@',
  role: 'user',
  banned: 'false',
};

describe('UserFiltersComponent', () => {
  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(
      <UserFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const nameInput = screen.getByLabelText('用户名');
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice');
    const emailInput = screen.getByLabelText('邮箱');
    await user.clear(emailInput);
    await user.type(emailInput, 'a@');
    await user.click(screen.getByRole('button', { name: '管理员' }));
    await user.click(screen.getByRole('button', { name: '已封禁' }));
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: 'Alice',
      email: 'a@',
      role: 'admin',
      banned: 'true',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear role and banned filters', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <UserFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: '全部' })[0]);
    await user.click(screen.getAllByRole('button', { name: '全部' })[1]);
    await user.type(screen.getByLabelText('用户名'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        role: undefined,
        banned: undefined,
      }),
    );
  });

  it('submits on Enter from the email field and ignores empty toggle changes', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <UserFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '用户' }));
    await user.click(screen.getByRole('button', { name: '正常' }));
    await user.type(screen.getByLabelText('邮箱'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        role: 'user',
        banned: 'false',
      }),
    );
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = render(
      <UserFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <UserFiltersComponent
        committedFilters={{ ...filters, name: '新' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('用户名')).toHaveValue('新');
  });
});
