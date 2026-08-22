import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameDungeonFormComponent } from '@/routes/_authenticated/admin/game-dungeons/-components/GameDungeonFormComponent';
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

const emptyValues = {
  name: '',
  expansionId: '',
  seasonId: '',
  playerLimit: '',
  difficulty: 'normal' as const,
  levelRequirement: '',
  bossCount: '',
  resetWeekdays: [] as number[],
};

const filledValues = {
  name: '河阳之战',
  expansionId: 'expansion-1',
  seasonId: 'season-1',
  playerLimit: '25',
  difficulty: 'heroic' as const,
  levelRequirement: '120',
  bossCount: '6',
  resetWeekdays: [1],
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('GameDungeonFormComponent', () => {
  beforeEach(() => {
    adminListGameExpansions.mockReset();
    adminListGameSeasons.mockReset();
    adminListGameExpansions.mockResolvedValue(expansions);
    adminListGameSeasons.mockResolvedValue(seasons);
  });

  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <>
        <GameDungeonFormComponent
          formId="dungeon-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="dungeon-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('alert')
        .some((el) => el.textContent === '请选择资料片'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('alert')
        .some((el) => el.textContent === '请选择赛季'),
    ).toBe(true);
  });

  it('submits valid values and toggles weekdays and difficulty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <>
        <GameDungeonFormComponent
          formId="dungeon-form"
          initialValues={filledValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="dungeon-form">
          提交
        </button>
      </>,
    );

    await chooseSelectOption(user, '资料片', '剑胆琴心');
    await chooseSelectOption(user, '赛季', '赛季一');
    await user.click(screen.getByRole('button', { name: '挑战' }));
    await user.click(screen.getByRole('button', { name: '周四' }));
    await user.click(screen.getByRole('button', { name: '周一' }));
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: '河阳之战',
      expansionId: 'expansion-1',
      seasonId: 'season-1',
      playerLimit: '25',
      difficulty: 'challenge',
      levelRequirement: '120',
      bossCount: '6',
      resetWeekdays: [4],
    });
  });

  it('keeps the current difficulty when the toggle is cleared', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <>
        <GameDungeonFormComponent
          formId="dungeon-form"
          initialValues={filledValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="dungeon-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '英雄' }));
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: 'heroic' }),
    );
  });
});
