import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MinesweeperBoardCellComponent from '@/routes/_authenticated/game-assist/minesweeper/-components/MinesweeperBoardCellComponent';
import { MinesweeperCell } from '@/routes/_authenticated/game-assist/minesweeper/-lib/minesweeper-cell';

describe('MinesweeperBoardCellComponent', () => {
  it('clicks left and right on an empty cell', async () => {
    const user = userEvent.setup();
    const onLeftClick = vi.fn();
    const onRightClick = vi.fn();
    const cell = MinesweeperCell.createEmptyCell(0, 0);

    render(
      <MinesweeperBoardCellComponent
        cell={cell}
        selected={false}
        explodeHint={false}
        flagHint={false}
        pendingValue={false}
        onLeftClick={onLeftClick}
        onRightClick={onRightClick}
      />,
    );

    const button = screen.getByRole('button', { name: /未开/ });
    await user.click(button);
    expect(onLeftClick).toHaveBeenCalled();
    await user.pointer({ keys: '[MouseRight]', target: button });
    expect(onRightClick).toHaveBeenCalled();
  });

  it('renders flagged, exploded, and hint states', () => {
    const flagged = MinesweeperCell.createEmptyCell(0, 1);
    flagged.setFlag();
    const { rerender } = render(
      <MinesweeperBoardCellComponent
        cell={flagged}
        selected
        explodeHint={false}
        flagHint
        pendingValue={false}
        onLeftClick={vi.fn()}
        onRightClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /已插旗/ })).toBeInTheDocument();

    const exploded = MinesweeperCell.createEmptyCell(1, 1);
    exploded.explode(3);
    rerender(
      <MinesweeperBoardCellComponent
        cell={exploded}
        selected={false}
        explodeHint
        flagHint={false}
        pendingValue
        onLeftClick={vi.fn()}
        onRightClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /数字 3/ })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
