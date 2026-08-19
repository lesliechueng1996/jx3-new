import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KungfuFiltersComponent } from '@/routes/_authenticated/admin/kungfus/-components/KungfuFiltersComponent';
import type { KungfusSearch } from '@/routes/_authenticated/admin/kungfus/-lib/kungfus-schema';
import { renderWithQueryClient } from '../../../../../helpers/render';

const { listAllSchools } = vi.hoisted(() => ({
  listAllSchools: vi.fn(),
}));

vi.mock('@/lib/api/schools-api', () => ({
  schoolsAllQueryKey: ['schools-all'],
  listAllSchools,
}));

const schools = [
  {
    id: 'school-1',
    name: '纯阳',
    type: 'school' as const,
    icon: null,
    alias: [],
  },
];

const filters: KungfusSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  schoolId: 'school-1',
  kungfuType: 'attack',
  isUnlimited: 'true',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('KungfuFiltersComponent', () => {
  beforeEach(() => {
    listAllSchools.mockReset();
    listAllSchools.mockResolvedValue(schools);
  });

  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    renderWithQueryClient(
      <KungfuFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const nameInput = screen.getByLabelText('名称');
    await user.clear(nameInput);
    await user.type(nameInput, '紫霞功');
    await chooseSelectOption(user, '门派', '纯阳');
    await chooseSelectOption(user, '心法类型', '治疗');
    await chooseSelectOption(user, '无界', '非无界');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '紫霞功',
      schoolId: 'school-1',
      kungfuType: 'heal',
      isUnlimited: 'false',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear filters', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <KungfuFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '门派', '全部');
    await chooseSelectOption(user, '心法类型', '全部');
    await chooseSelectOption(user, '无界', '全部');
    await user.type(screen.getByLabelText('名称'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        schoolId: undefined,
        kungfuType: undefined,
        isUnlimited: undefined,
      }),
    );
  });

  it('can select defense and unlimited filters', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <KungfuFiltersComponent
        committedFilters={{
          ...filters,
          kungfuType: undefined,
          isUnlimited: undefined,
          schoolId: undefined,
        }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '心法类型', '防御');
    await chooseSelectOption(user, '无界', '无界');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        kungfuType: 'defense',
        isUnlimited: 'true',
      }),
    );
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = renderWithQueryClient(
      <KungfuFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <KungfuFiltersComponent
        committedFilters={{ ...filters, name: '新' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('名称')).toHaveValue('新');
  });
});
