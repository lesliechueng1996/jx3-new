import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameDungeonFiltersComponent } from '@/routes/_authenticated/admin/game-dungeons/-components/GameDungeonFiltersComponent';
import type { GameDungeonsSearch } from '@/routes/_authenticated/admin/game-dungeons/-lib/game-dungeons-schema';
import { renderWithQueryClient } from '../../../../../helpers/render';

const { adminListGameExpansions, adminListGameSeasons } = vi.hoisted(() => ({
  adminListGameExpansions: vi.fn(),
  adminListGameSeasons: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-game-expansions-api', () => ({
  adminListGameExpansions,
}));

vi.mock('@/lib/api/admin/admin-game-seasons-api', () => ({
  adminListGameSeasons,
}));

const expansions = {
  items: [
    {
      id: 'expansion-1',
      name: '剑胆琴心',
      description: null,
      level: 120,
      startDate: '2026-01-01',
      endDate: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ],
};

const seasons = {
  items: [
    {
      id: 'season-1',
      expansionId: 'expansion-1',
      name: '赛季一',
      description: null,
      startDate: '2026-01-01',
      endDate: null,
      sortOrder: 0,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ],
};

const filters: GameDungeonsSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  expansionId: 'expansion-1',
  seasonId: 'season-1',
  difficulty: 'heroic',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('GameDungeonFiltersComponent', () => {
  beforeEach(() => {
    adminListGameExpansions.mockReset();
    adminListGameSeasons.mockReset();
    adminListGameExpansions.mockResolvedValue(expansions);
    adminListGameSeasons.mockResolvedValue(seasons);
  });

  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    renderWithQueryClient(
      <GameDungeonFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const nameInput = screen.getByLabelText('名称');
    await user.clear(nameInput);
    await user.type(nameInput, '河阳之战');
    await chooseSelectOption(user, '资料片', '剑胆琴心');
    await chooseSelectOption(user, '赛季', '赛季一');
    await chooseSelectOption(user, '难度', '挑战');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '河阳之战',
      expansionId: 'expansion-1',
      seasonId: 'season-1',
      difficulty: 'challenge',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear filters', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <GameDungeonFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '资料片', '全部');
    await chooseSelectOption(user, '难度', '全部');
    await user.type(screen.getByLabelText('名称'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        expansionId: undefined,
        seasonId: undefined,
        difficulty: undefined,
      }),
    );
  });

  it('can select normal difficulty', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <GameDungeonFiltersComponent
        committedFilters={{ ...filters, difficulty: undefined }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '难度', '普通');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: 'normal' }),
    );
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = renderWithQueryClient(
      <GameDungeonFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <GameDungeonFiltersComponent
        committedFilters={{ ...filters, name: '新' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('名称')).toHaveValue('新');
  });
});
