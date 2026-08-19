import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SchoolFiltersComponent } from '@/routes/_authenticated/admin/schools/-components/SchoolFiltersComponent';
import type { SchoolsSearch } from '@/routes/_authenticated/admin/schools/-lib/schools-schema';

const filters: SchoolsSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  type: 'school',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('SchoolFiltersComponent', () => {
  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(
      <SchoolFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const nameInput = screen.getByLabelText('名称');
    await user.clear(nameInput);
    await user.type(nameInput, '纯阳');
    await chooseSelectOption(user, '类型', '流派');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '纯阳',
      type: 'genre',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear the type filter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <SchoolFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '类型', '全部');
    await user.type(screen.getByLabelText('名称'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        type: undefined,
      }),
    );
  });

  it('can select the school type', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <SchoolFiltersComponent
        committedFilters={{ ...filters, type: undefined }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '类型', '门派');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'school' }),
    );
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = render(
      <SchoolFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <SchoolFiltersComponent
        committedFilters={{ ...filters, name: '新' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('名称')).toHaveValue('新');
  });
});
