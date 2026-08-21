import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameSeasonCreateDialogComponent } from '@/routes/_authenticated/admin/game-expansions/-components/GameSeasonCreateDialogComponent';

describe('GameSeasonCreateDialogComponent', () => {
  it('submits a new season and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GameSeasonCreateDialogComponent
        expansionId="exp-1"
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('名称'), 'S1');
    fireEvent.change(screen.getByLabelText('起始日期'), {
      target: { value: '2024-06-01' },
    });
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      expansionId: 'exp-1',
      name: 'S1',
      description: null,
      startDate: '2024-06-01',
      endDate: null,
      sortOrder: 0,
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not submit without an expansion id', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <GameSeasonCreateDialogComponent
        expansionId={null}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('名称'), 'S1');
    fireEvent.change(screen.getByLabelText('起始日期'), {
      target: { value: '2024-06-01' },
    });
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
    fireEvent.submit(
      document.getElementById('game-season-create-form') as HTMLFormElement,
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a pending spinner', () => {
    render(
      <GameSeasonCreateDialogComponent
        expansionId="exp-1"
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form when closed', () => {
    render(
      <GameSeasonCreateDialogComponent
        expansionId="exp-1"
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
  });
});
