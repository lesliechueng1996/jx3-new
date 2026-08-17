import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MinesweeperBoardComponent from '@/routes/_authenticated/game-assist/minesweeper/-components/MinesweeperBoardComponent';
import { MinesweeperGame } from '@/routes/_authenticated/game-assist/minesweeper/-lib/minesweeper-game';

describe('MinesweeperBoardComponent', () => {
  it('forwards left and right clicks for a selected cell', async () => {
    const user = userEvent.setup();
    const onLeftClick = vi.fn();
    const onRightClick = vi.fn();
    const game = new MinesweeperGame(2, 2, 1);

    render(
      <MinesweeperBoardComponent
        game={game}
        selected={{ row: 0, column: 0 }}
        explodeKeys={new Set(['0-1'])}
        flagKeys={new Set(['1-0'])}
        pendingValueKeys={new Set(['1-1'])}
        onLeftClick={onLeftClick}
        onRightClick={onRightClick}
      />,
    );

    expect(screen.getByText(/左键开格并递增数字/)).toBeInTheDocument();
    const cells = screen.getAllByRole('button');
    await user.click(cells[0]);
    expect(onLeftClick).toHaveBeenCalledWith(0, 0);
    await user.pointer({ keys: '[MouseRight]', target: cells[1] });
    expect(onRightClick).toHaveBeenCalled();
  });
});
