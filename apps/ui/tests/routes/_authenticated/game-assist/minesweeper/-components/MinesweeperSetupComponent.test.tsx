import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MinesweeperSetupComponent from '@/routes/_authenticated/game-assist/minesweeper/-components/MinesweeperSetupComponent';

describe('MinesweeperSetupComponent', () => {
  it('starts a preset game and switches modes', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    const onStart = vi.fn();
    const onReset = vi.fn();

    const { rerender } = render(
      <MinesweeperSetupComponent
        mode="challenge"
        rows="14"
        columns="14"
        mines="80"
        error={null}
        hasGame={false}
        onModeChange={onModeChange}
        onRowsChange={vi.fn()}
        onColumnsChange={vi.fn()}
        onMinesChange={vi.fn()}
        onStart={onStart}
        onReset={onReset}
      />,
    );

    expect(screen.getByText(/14 行 × 14 列/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(onStart).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '英雄' }));
    expect(onModeChange).toHaveBeenCalledWith('hero');

    rerender(
      <MinesweeperSetupComponent
        mode="hero"
        rows="12"
        columns="12"
        mines="42"
        error={null}
        hasGame
        onModeChange={onModeChange}
        onRowsChange={vi.fn()}
        onColumnsChange={vi.fn()}
        onMinesChange={vi.fn()}
        onStart={onStart}
        onReset={onReset}
      />,
    );
    expect(
      screen.getByRole('button', { name: '重新开局' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '清空棋盘' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('edits custom fields and shows errors', async () => {
    const user = userEvent.setup();
    const onRowsChange = vi.fn();
    render(
      <MinesweeperSetupComponent
        mode="custom"
        rows="2"
        columns="2"
        mines="1"
        error="行数需要是 1–20 的整数"
        hasGame={false}
        onModeChange={vi.fn()}
        onRowsChange={onRowsChange}
        onColumnsChange={vi.fn()}
        onMinesChange={vi.fn()}
        onStart={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('行数'), '3');
    expect(onRowsChange).toHaveBeenCalled();
    expect(screen.getByText('行数需要是 1–20 的整数')).toBeInTheDocument();
  });
});
