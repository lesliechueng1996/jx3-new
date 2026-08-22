import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminGameDungeonListItem } from '@/lib/api/admin/admin-game-dungeons-api';
import { GameDungeonEditDialogComponent } from '@/routes/_authenticated/admin/game-dungeons/-components/GameDungeonEditDialogComponent';
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

const dungeon: AdminGameDungeonListItem = {
  id: '1',
  name: '河阳之战',
  expansionId: 'expansion-1',
  expansionName: '剑胆琴心',
  seasonId: 'season-1',
  seasonName: '赛季一',
  playerLimit: 25,
  difficulty: 'heroic',
  levelRequirement: 120,
  bossCount: 6,
  resetWeekdays: [1, 4],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('GameDungeonEditDialogComponent', () => {
  beforeEach(() => {
    adminListGameExpansions.mockReset();
    adminListGameSeasons.mockReset();
    adminListGameExpansions.mockResolvedValue({
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
    });
    adminListGameSeasons.mockResolvedValue({
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
    });
  });

  it('submits edited values and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    renderWithQueryClient(
      <GameDungeonEditDialogComponent
        dungeon={dungeon}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('名称'));
    await user.type(screen.getByLabelText('名称'), '河阳');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '河阳',
      expansionId: 'expansion-1',
      seasonId: 'season-1',
      playerLimit: 25,
      difficulty: 'heroic',
      levelRequirement: 120,
      bossCount: 6,
      resetWeekdays: [1, 4],
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    renderWithQueryClient(
      <GameDungeonEditDialogComponent
        dungeon={dungeon}
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form without a dungeon', () => {
    renderWithQueryClient(
      <GameDungeonEditDialogComponent
        dungeon={null}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });
});
