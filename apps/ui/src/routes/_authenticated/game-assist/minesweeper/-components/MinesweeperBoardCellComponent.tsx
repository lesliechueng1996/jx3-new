import { cn } from '@/lib/utils';
import {
  type MinesweeperCell,
  MinesweeperCellType,
} from '../-lib/minesweeper-cell';

type MinesweeperBoardCellComponentProps = {
  cell: MinesweeperCell;
  selected: boolean;
  explodeHint: boolean;
  flagHint: boolean;
  pendingValue: boolean;
  onLeftClick: () => void;
  onRightClick: () => void;
};

const NUMBER_CLASS: Record<number, string> = {
  1: 'text-sky-800',
  2: 'text-emerald-700',
  3: 'text-rose-600',
  4: 'text-indigo-800',
  5: 'text-red-800',
  6: 'text-teal-700',
  7: 'text-foreground',
  8: 'text-muted-foreground',
};

const MinesweeperBoardCellComponent = ({
  cell,
  selected,
  explodeHint,
  flagHint,
  pendingValue,
  onLeftClick,
  onRightClick,
}: MinesweeperBoardCellComponentProps) => {
  const type = cell.getType();
  const value = cell.getValue();
  const label = cell.getCellLabel();
  const isExploded = type === MinesweeperCellType.EXPLODED;
  const isFlagged = type === MinesweeperCellType.FLAGGED;

  return (
    <button
      type="button"
      aria-label={`${label}${isFlagged ? '，已插旗' : isExploded ? `，数字 ${value}` : '，未开'}`}
      className={cn(
        'relative flex size-10 items-center justify-center border-4 font-mono text-base font-semibold select-none',
        isExploded
          ? 'bg-zinc-300 hover:bg-zinc-400'
          : 'bg-sky-300 hover:bg-sky-400',
        pendingValue
          ? 'border-yellow-400'
          : explodeHint
            ? 'border-emerald-500'
            : flagHint
              ? 'border-rose-500'
              : selected
                ? 'border-foreground'
                : 'border-transparent',
      )}
      onClick={onLeftClick}
      onContextMenu={(event) => {
        event.preventDefault();
        onRightClick();
      }}
    >
      <span className="absolute top-0.5 left-0.5 text-[9px] leading-none font-normal text-foreground/55">
        {label}
      </span>
      {isFlagged ? (
        <span aria-hidden>🚩</span>
      ) : isExploded && value > 0 ? (
        <span className={NUMBER_CLASS[value]}>{value}</span>
      ) : null}
    </button>
  );
};

export default MinesweeperBoardCellComponent;
