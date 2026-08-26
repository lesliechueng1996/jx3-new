import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RaidRunFiltersComponent } from '@/routes/_authenticated/admin/raid-runs/-components/RaidRunFiltersComponent';
import type { RaidRunsSearch } from '@/routes/_authenticated/admin/raid-runs/-lib/raid-runs-schema';
import { renderWithQueryClient } from '../../../../../helpers/render';

const { searchGameDungeons, adminGetGameDungeon } = vi.hoisted(() => ({
  searchGameDungeons: vi.fn(),
  adminGetGameDungeon: vi.fn(),
}));

vi.mock('@/lib/api/game-dungeons-api', () => ({
  gameDungeonsSearchQueryKey: (name: string) => ['game-dungeons-search', name],
  searchGameDungeons,
}));

vi.mock('@/lib/api/admin/admin-game-dungeons-api', () => ({
  adminGameDungeonQueryKey: (id: string) => ['admin-game-dungeon', id],
  adminGetGameDungeon,
}));

const dungeon = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '河阳之战',
  expansionId: 'exp-1',
  expansionName: '资料片',
  seasonId: 'season-1',
  seasonName: '赛季',
  playerLimit: 25,
  difficulty: 'heroic' as const,
  levelRequirement: 120,
  bossCount: 6,
};

const filters: RaidRunsSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  status: 'pending',
  dungeonId: undefined,
  startDate: undefined,
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
  beforeEach(() => {
    searchGameDungeons.mockReset();
    adminGetGameDungeon.mockReset();
    searchGameDungeons.mockResolvedValue([dungeon]);
    adminGetGameDungeon.mockResolvedValue(dungeon);
  });

  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    renderWithQueryClient(
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
    fireEvent.change(screen.getByLabelText('开团日期'), {
      target: { value: '2026-08-22' },
    });
    const dungeonInput = screen.getByLabelText('副本');
    await user.type(dungeonInput, '河阳');
    await user.click(
      await screen.findByRole('option', {
        name: '河阳之战（英雄 · 25人）',
      }),
    );
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '周六团',
      status: 'recruiting',
      dungeonId: dungeon.id,
      startDate: '2026-08-22',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear the status filter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
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
    renderWithQueryClient(
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

  it('syncs draft filters when committed values change', async () => {
    const { rerender } = renderWithQueryClient(
      <RaidRunFiltersComponent
        committedFilters={{ ...filters, dungeonId: dungeon.id }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(adminGetGameDungeon).toHaveBeenCalledWith(dungeon.id);
    });
    await waitFor(() => {
      expect(screen.getByLabelText('副本')).toHaveValue(
        '河阳之战（英雄 · 25人）',
      );
    });

    rerender(
      <RaidRunFiltersComponent
        committedFilters={{ ...filters, name: '新', dungeonId: undefined }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('名称')).toHaveValue('新');
    await waitFor(() => {
      expect(screen.getByLabelText('副本')).toHaveValue('');
    });
  });
});
