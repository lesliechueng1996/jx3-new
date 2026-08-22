import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameDungeonCreateDialogComponent } from '@/routes/_authenticated/admin/game-dungeons/-components/GameDungeonCreateDialogComponent';
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

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('GameDungeonCreateDialogComponent', () => {
  beforeEach(() => {
    adminListGameExpansions.mockReset();
    adminListGameSeasons.mockReset();
    adminListGameExpansions.mockResolvedValue(expansions);
    adminListGameSeasons.mockResolvedValue(seasons);
  });

  it('submits a new dungeon and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    renderWithQueryClient(
      <GameDungeonCreateDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('名称'), '河阳之战');
    await chooseSelectOption(user, '资料片', '剑胆琴心');
    await chooseSelectOption(user, '赛季', '赛季一');
    await user.type(screen.getByLabelText('人数'), '25');
    await user.type(screen.getByLabelText('等级'), '120');
    await user.type(screen.getByLabelText('Boss 数量'), '6');
    await user.click(screen.getByRole('button', { name: '周一' }));
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '河阳之战',
      expansionId: 'expansion-1',
      seasonId: 'season-1',
      playerLimit: 25,
      difficulty: 'normal',
      levelRequirement: 120,
      bossCount: 6,
      resetWeekdays: [1],
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    renderWithQueryClient(
      <GameDungeonCreateDialogComponent
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form when closed', () => {
    renderWithQueryClient(
      <GameDungeonCreateDialogComponent
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
  });
});
