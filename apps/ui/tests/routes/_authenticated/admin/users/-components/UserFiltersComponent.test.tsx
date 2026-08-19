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

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
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
    await chooseSelectOption(user, '角色', '管理员');
    await chooseSelectOption(user, '状态', '已封禁');
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

    await chooseSelectOption(user, '角色', '全部');
    await chooseSelectOption(user, '状态', '全部');
    await user.type(screen.getByLabelText('用户名'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        role: undefined,
        banned: undefined,
      }),
    );
  });

  it('submits on Enter from the email field', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <UserFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '角色', '用户');
    await chooseSelectOption(user, '状态', '正常');
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
