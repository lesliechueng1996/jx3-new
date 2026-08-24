import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RecordGameRaidIdDialogComponent } from '@/routes/_authenticated/raid-run/-components/RecordGameRaidIdDialogComponent';

describe('RecordGameRaidIdDialogComponent', () => {
  it('submits a trimmed id and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <RecordGameRaidIdDialogComponent
        open
        pending={false}
        initialGameRaidId=" game-1 "
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('游戏副本ID'));
    await user.type(screen.getByLabelText('游戏副本ID'), '  game-2  ');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith('game-2');

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('rejects an empty or oversized id and clears the error on edit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <RecordGameRaidIdDialogComponent
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('游戏副本ID不能为空')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('游戏副本ID'), 'a'.repeat(65));
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('游戏副本ID不能超过64个字符')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('游戏副本ID'), 'x');
    expect(
      screen.queryByText('游戏副本ID不能超过64个字符'),
    ).not.toBeInTheDocument();
  });

  it('shows a pending spinner', () => {
    render(
      <RecordGameRaidIdDialogComponent
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not reset values while closed', () => {
    const { rerender } = render(
      <RecordGameRaidIdDialogComponent
        open={false}
        pending={false}
        initialGameRaidId="game-1"
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    rerender(
      <RecordGameRaidIdDialogComponent
        open
        pending={false}
        initialGameRaidId="game-1"
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('游戏副本ID')).toHaveValue('game-1');
  });
});
