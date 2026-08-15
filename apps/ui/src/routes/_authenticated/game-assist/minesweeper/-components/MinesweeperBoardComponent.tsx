import type { MinesweeperGame } from '../-lib/minesweeper-game';
import { cellPositionKey } from '../-lib/minesweeper-setup';
import MinesweeperBoardCellComponent from './MinesweeperBoardCellComponent';

type SelectedCell = {
  row: number;
  column: number;
};

type MinesweeperBoardComponentProps = {
  game: MinesweeperGame;
  selected: SelectedCell | null;
  explodeKeys: Set<string>;
  flagKeys: Set<string>;
  pendingValueKeys: Set<string>;
  onLeftClick: (row: number, column: number) => void;
  onRightClick: (row: number, column: number) => void;
};

const MinesweeperBoardComponent = ({
  game,
  selected,
  explodeKeys,
  flagKeys,
  pendingValueKeys,
  onLeftClick,
  onRightClick,
}: MinesweeperBoardComponentProps) => {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        className="grid w-fit gap-px bg-foreground/10 p-px"
        style={{
          gridTemplateColumns: `repeat(${game.columns}, minmax(0, 2.5rem))`,
        }}
      >
        {game.cells.flatMap((rowCells, row) =>
          rowCells.map((cell, column) => {
            const key = cellPositionKey(row, column);
            return (
              <MinesweeperBoardCellComponent
                key={key}
                cell={cell}
                selected={selected?.row === row && selected?.column === column}
                explodeHint={explodeKeys.has(key)}
                flagHint={flagKeys.has(key)}
                pendingValue={pendingValueKeys.has(key)}
                onLeftClick={() => onLeftClick(row, column)}
                onRightClick={() => onRightClick(row, column)}
              />
            );
          }),
        )}
      </div>
      <p className="max-w-xl text-center text-sm text-muted-foreground">
        左键开格并递增数字，右键插旗 / 取消，数字键 0–8
        可直接改当前格。绿框是建议开格，红框是建议插旗，黄框是已点开但数字待确认。
      </p>
    </div>
  );
};

export default MinesweeperBoardComponent;
