import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminGameSeasonListItem } from '@/lib/api/admin/admin-game-seasons-api';
import { GameSeasonEditDialogComponent } from '@/routes/_authenticated/admin/game-expansions/-components/GameSeasonEditDialogComponent';

const season: AdminGameSeasonListItem = {
  id: '1',
  expansionId: 'exp-1',
  name: 'S1',
  description: '描述',
  startDate: '2024-06-01',
  endDate: '2024-12-31',
  sortOrder: 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('GameSeasonEditDialogComponent', () => {
  it('submits edited values and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GameSeasonEditDialogComponent
        season={season}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('名称'));
    await user.type(screen.getByLabelText('名称'), 'S2');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'S2',
      description: '描述',
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      sortOrder: 1,
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <GameSeasonEditDialogComponent
        season={season}
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form without a season', () => {
    render(
      <GameSeasonEditDialogComponent
        season={null}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });

  it('fills empty optional fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <GameSeasonEditDialogComponent
        season={{
          ...season,
          description: null,
          endDate: null,
        }}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'S1',
      description: null,
      startDate: '2024-06-01',
      endDate: null,
      sortOrder: 1,
    });
  });
});
