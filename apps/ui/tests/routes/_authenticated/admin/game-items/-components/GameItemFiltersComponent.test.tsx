import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameItemFiltersComponent } from '@/routes/_authenticated/admin/game-items/-components/GameItemFiltersComponent';
import type { GameItemsSearch } from '@/routes/_authenticated/admin/game-items/-lib/game-items-schema';

const filters: GameItemsSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  type: 'equipment',
  quality: 'white',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('GameItemFiltersComponent', () => {
  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(
      <GameItemFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const nameInput = screen.getByLabelText('名称');
    await user.clear(nameInput);
    await user.type(nameInput, '上品玄晶');
    await chooseSelectOption(user, '类型', '特殊');
    await chooseSelectOption(user, '品质', '橙');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '上品玄晶',
      type: 'special',
      quality: 'orange',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear filters', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <GameItemFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '类型', '全部');
    await chooseSelectOption(user, '品质', '全部');
    await user.type(screen.getByLabelText('名称'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        type: undefined,
        quality: undefined,
      }),
    );
  });

  it('can select remaining type and quality options', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <GameItemFiltersComponent
        committedFilters={{ ...filters, type: undefined, quality: undefined }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '类型', '装备');
    await chooseSelectOption(user, '品质', '白');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'equipment', quality: 'white' }),
    );

    await chooseSelectOption(user, '类型', '小铁');
    await chooseSelectOption(user, '品质', '绿');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'small_iron', quality: 'green' }),
    );

    await chooseSelectOption(user, '类型', '附魔');
    await chooseSelectOption(user, '品质', '蓝');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'enchantment', quality: 'blue' }),
    );

    await chooseSelectOption(user, '品质', '紫');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 'purple' }),
    );
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = render(
      <GameItemFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <GameItemFiltersComponent
        committedFilters={{ ...filters, name: '新' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('名称')).toHaveValue('新');
  });
});
