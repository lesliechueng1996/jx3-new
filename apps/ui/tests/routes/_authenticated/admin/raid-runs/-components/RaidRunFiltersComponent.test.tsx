import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RaidRunFiltersComponent } from '@/routes/_authenticated/admin/raid-runs/-components/RaidRunFiltersComponent';
import type { RaidRunsSearch } from '@/routes/_authenticated/admin/raid-runs/-lib/raid-runs-schema';

const filters: RaidRunsSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  status: 'pending',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('RaidRunFiltersComponent', () => {
  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(
      <RaidRunFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const nameInput = screen.getByLabelText('名称');
    await user.clear(nameInput);
    await user.type(nameInput, '周六团');
    await chooseSelectOption(user, '状态', '招募中');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '周六团',
      status: 'recruiting',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear the status filter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <RaidRunFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '状态', '全部');
    await user.type(screen.getByLabelText('名称'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        status: undefined,
      }),
    );
  });

  it('can select every raid run status', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <RaidRunFiltersComponent
        committedFilters={{ ...filters, status: undefined }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    const options = [
      ['待开始', 'pending'],
      ['进行中', 'ongoing'],
      ['已完成', 'completed'],
      ['已取消', 'cancelled'],
    ] as const;

    for (const [label, status] of options) {
      await chooseSelectOption(user, '状态', label);
      await user.click(screen.getByRole('button', { name: '搜索' }));
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({ status }),
      );
    }
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = render(
      <RaidRunFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <RaidRunFiltersComponent
        committedFilters={{ ...filters, name: '新' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('名称')).toHaveValue('新');
  });
});
