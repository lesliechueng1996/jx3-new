import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpansionSeasonSelectComponent } from '@/routes/_authenticated/admin/game-dungeons/-components/ExpansionSeasonSelectComponent';
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

describe('ExpansionSeasonSelectComponent', () => {
  beforeEach(() => {
    adminListGameExpansions.mockReset();
    adminListGameSeasons.mockReset();
    adminListGameExpansions.mockResolvedValue(expansions);
    adminListGameSeasons.mockResolvedValue(seasons);
  });

  it('loads seasons after an expansion is chosen and clears season on change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = renderWithQueryClient(
      <ExpansionSeasonSelectComponent
        expansionFieldId="expansion"
        seasonFieldId="season"
        allowEmpty
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('combobox', { name: '赛季' })).toBeDisabled();
    await chooseSelectOption(user, '资料片', '剑胆琴心');
    expect(onChange).toHaveBeenCalledWith({
      expansionId: 'expansion-1',
      seasonId: undefined,
    });

    rerender(
      <ExpansionSeasonSelectComponent
        expansionFieldId="expansion"
        seasonFieldId="season"
        expansionId="expansion-1"
        allowEmpty
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(adminListGameSeasons).toHaveBeenCalledWith('expansion-1');
    });
  });

  it('selects a season for the current expansion', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithQueryClient(
      <ExpansionSeasonSelectComponent
        expansionFieldId="expansion"
        seasonFieldId="season"
        expansionId="expansion-1"
        allowEmpty
        onChange={onChange}
      />,
    );

    await chooseSelectOption(user, '赛季', '赛季一');
    expect(onChange).toHaveBeenCalledWith({
      expansionId: 'expansion-1',
      seasonId: 'season-1',
    });
  });

  it('clears filters back to all', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithQueryClient(
      <ExpansionSeasonSelectComponent
        expansionFieldId="expansion"
        seasonFieldId="season"
        expansionId="expansion-1"
        seasonId="season-1"
        allowEmpty
        onChange={onChange}
      />,
    );

    await chooseSelectOption(user, '资料片', '全部');
    expect(onChange).toHaveBeenCalledWith({
      expansionId: undefined,
      seasonId: undefined,
    });

    await chooseSelectOption(user, '赛季', '全部');
    expect(onChange).toHaveBeenCalledWith({
      expansionId: 'expansion-1',
      seasonId: undefined,
    });
  });

  it('shows load errors', async () => {
    adminListGameExpansions.mockRejectedValue(new Error('fail'));
    adminListGameSeasons.mockRejectedValue(new Error('fail'));
    renderWithQueryClient(
      <ExpansionSeasonSelectComponent
        expansionFieldId="expansion"
        seasonFieldId="season"
        expansionId="expansion-1"
        onChange={vi.fn()}
      />,
    );

    expect(await screen.findByText('加载资料片失败')).toBeInTheDocument();
    expect(await screen.findByText('加载赛季失败')).toBeInTheDocument();
  });
});
