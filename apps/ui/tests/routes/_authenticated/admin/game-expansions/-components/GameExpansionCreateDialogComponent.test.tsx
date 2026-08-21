import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameExpansionCreateDialogComponent } from '@/routes/_authenticated/admin/game-expansions/-components/GameExpansionCreateDialogComponent';

describe('GameExpansionCreateDialogComponent', () => {
  it('submits a new expansion and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GameExpansionCreateDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText('等级')).toHaveValue(130);
    await user.type(screen.getByLabelText('名称'), '江湖');
    fireEvent.change(screen.getByLabelText('起始日期'), {
      target: { value: '2024-01-01' },
    });
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '江湖',
      level: 130,
      description: null,
      startDate: '2024-01-01',
      endDate: null,
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <GameExpansionCreateDialogComponent
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
      <GameExpansionCreateDialogComponent
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
  });
});
