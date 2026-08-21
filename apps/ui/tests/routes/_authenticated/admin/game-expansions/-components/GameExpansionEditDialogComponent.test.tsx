import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminGameExpansionListItem } from '@/lib/api/admin/admin-game-expansions-api';
import { GameExpansionEditDialogComponent } from '@/routes/_authenticated/admin/game-expansions/-components/GameExpansionEditDialogComponent';

const expansion: AdminGameExpansionListItem = {
  id: '1',
  name: '江湖',
  description: '描述',
  level: 120,
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('GameExpansionEditDialogComponent', () => {
  it('submits edited values and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GameExpansionEditDialogComponent
        expansion={expansion}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('名称'));
    await user.type(screen.getByLabelText('名称'), '万灵山庄');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '万灵山庄',
      level: 120,
      description: '描述',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <GameExpansionEditDialogComponent
        expansion={expansion}
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form without an expansion', () => {
    render(
      <GameExpansionEditDialogComponent
        expansion={null}
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
      <GameExpansionEditDialogComponent
        expansion={{
          ...expansion,
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
      name: '江湖',
      level: 120,
      description: null,
      startDate: '2024-01-01',
      endDate: null,
    });
  });
});
