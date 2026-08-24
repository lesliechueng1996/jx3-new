import { createFileRoute } from '@tanstack/react-router';
import { CircleCheckIcon, RotateCcwIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import MinesweeperAnalysisPanelComponent, {
  type MinesweeperAnalysisView,
} from './-components/MinesweeperAnalysisPanelComponent';
import MinesweeperBoardComponent from './-components/MinesweeperBoardComponent';
import MinesweeperSetupComponent from './-components/MinesweeperSetupComponent';
import {
  type MinesweeperCell,
  MinesweeperCellType,
} from './-lib/minesweeper-cell';
import { MinesweeperGame } from './-lib/minesweeper-game';
import {
  CHALLENGE_CONFIG,
  cellPositionKey,
  type DifficultyMode,
  type MinesweeperConfig,
  PRESET_CONFIGS,
  parseCellPositionKey,
  validateCustomConfig,
} from './-lib/minesweeper-setup';

export const Route = createFileRoute(
  '/_authenticated/game-assist/minesweeper/',
)({
  component: MinesweeperComponent,
});

type SelectedCell = {
  row: number;
  column: number;
};

function formatCellLabels(cells: MinesweeperCell[]): string {
  return cells.map((cell) => cell.getCellLabel()).join(' ');
}

async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // HTTP / permission errors fall through to the legacy path.
    }
  }
  return copyTextWithFallback(text);
}

function copyTextWithFallback(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function MinesweeperComponent() {
  const [mode, setMode] = useState<DifficultyMode>('challenge');
  const [rowsInput, setRowsInput] = useState(String(CHALLENGE_CONFIG.rows));
  const [columnsInput, setColumnsInput] = useState(
    String(CHALLENGE_CONFIG.columns),
  );
  const [minesInput, setMinesInput] = useState(String(CHALLENGE_CONFIG.mines));
  const [setupError, setSetupError] = useState<string | null>(null);
  const [game, setGame] = useState<MinesweeperGame | null>(null);
  const [, setBoardVersion] = useState(0);
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [enableCSP, setEnableCSP] = useState(true);
  const [analysis, setAnalysis] = useState<MinesweeperAnalysisView | null>(
    null,
  );
  const [pendingValueKeys, setPendingValueKeys] = useState<string[]>([]);

  const bumpBoard = useCallback(() => {
    setBoardVersion((current) => current + 1);
  }, []);

  const startGame = (config: MinesweeperConfig) => {
    setGame(new MinesweeperGame(config.rows, config.columns, config.mines));
    setSelected(null);
    setAnalysis(null);
    setPendingValueKeys([]);
    bumpBoard();
  };

  const handleStart = () => {
    if (mode !== 'custom') {
      setSetupError(null);
      startGame(PRESET_CONFIGS[mode]);
      return;
    }

    const result = validateCustomConfig(rowsInput, columnsInput, minesInput);
    if ('error' in result) {
      setSetupError(result.error);
      return;
    }
    setSetupError(null);
    startGame(result.config);
  };

  const handleResetBoard = () => {
    if (!game) {
      return;
    }
    startGame({
      rows: game.rows,
      columns: game.columns,
      mines: game.mines,
    });
  };

  const clearPendingValue = useCallback((row: number, column: number) => {
    const key = cellPositionKey(row, column);
    setPendingValueKeys((current) =>
      current.filter((pendingKey) => pendingKey !== key),
    );
  }, []);

  const handleLeftClick = (row: number, column: number) => {
    if (!game) {
      return;
    }
    const alreadySelected =
      selected?.row === row && selected?.column === column;
    game.revealOrCycleValue(row, column, alreadySelected);
    clearPendingValue(row, column);
    setSelected({ row, column });
    bumpBoard();
  };

  const handleRightClick = (row: number, column: number) => {
    if (!game) {
      return;
    }
    game.toggleFlag(row, column);
    clearPendingValue(row, column);
    setSelected({ row, column });
    bumpBoard();
  };

  const handleResetSelectedCell = () => {
    if (!game || !selected) {
      return;
    }
    game.resetCell(selected.row, selected.column);
    clearPendingValue(selected.row, selected.column);
    bumpBoard();
  };

  const handleCopy = async (text: string) => {
    if (!text) {
      return;
    }
    const copied = await copyText(text);
    toast.add({
      type: copied ? 'success' : 'error',
      description: copied ? '已复制到剪贴板' : '复制失败，请手动复制',
    });
  };

  const handleAnalyze = async () => {
    if (!game) {
      return;
    }
    const result = game.analyzeGame(enableCSP);
    const explodeText = formatCellLabels(result.needToExplodeCells);
    const flagText = formatCellLabels(result.needToFlagCells);
    const stuck = explodeText.length === 0 && flagText.length === 0;
    setAnalysis({
      explodeText,
      flagText,
      explodeKeys: result.needToExplodeCells.map((cell) =>
        cellPositionKey(cell.getRow(), cell.getColumn()),
      ),
      flagKeys: result.needToFlagCells.map((cell) =>
        cellPositionKey(cell.getRow(), cell.getColumn()),
      ),
      stuck,
    });

    const textToCopy = explodeText || flagText;
    if (!textToCopy) {
      return;
    }
    const copied = await copyText(textToCopy);
    toast.add({
      type: copied ? 'success' : 'error',
      description: copied
        ? explodeText
          ? '已复制开格建议'
          : '已复制插旗建议'
        : '复制失败，请手动复制',
    });
  };

  const parseAnalysisPositions = (keys: string[]) =>
    keys.flatMap((key) => {
      const position = parseCellPositionKey(key);
      return position ? [position] : [];
    });

  const handleApplyFlag = () => {
    if (!game || !analysis) {
      return;
    }
    const count = game.applySuggestedFlags(
      parseAnalysisPositions(analysis.flagKeys),
    );
    bumpBoard();
    toast.add({
      type: 'success',
      description: count > 0 ? `已插旗 ${count} 格` : '没有需要插旗的格子',
    });
  };

  const handleApplyExplode = () => {
    if (!game || !analysis) {
      return;
    }
    const undetermined = game.openSuggestedCells(
      parseAnalysisPositions(analysis.explodeKeys),
      parseAnalysisPositions(analysis.flagKeys),
    );
    setPendingValueKeys(
      undetermined.map((position) =>
        cellPositionKey(position.row, position.column),
      ),
    );
    bumpBoard();
    const openedCount = analysis.explodeKeys.length;
    toast.add({
      type: 'success',
      description:
        undetermined.length > 0
          ? `已点开 ${openedCount} 格，其中 ${undetermined.length} 格数字待确认`
          : `已点开 ${openedCount} 格，数字已确定`,
    });
  };

  useEffect(() => {
    if (!game || !selected) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key >= '0' && event.key <= '8') {
        event.preventDefault();
        game.setCellValue(selected.row, selected.column, Number(event.key));
        clearPendingValue(selected.row, selected.column);
        bumpBoard();
        return;
      }

      const moves: Record<string, SelectedCell> = {
        ArrowUp: { row: selected.row - 1, column: selected.column },
        ArrowDown: { row: selected.row + 1, column: selected.column },
        ArrowLeft: { row: selected.row, column: selected.column - 1 },
        ArrowRight: { row: selected.row, column: selected.column + 1 },
      };
      const next = moves[event.key];
      if (next) {
        event.preventDefault();
        setSelected({
          row: Math.min(game.rows - 1, Math.max(0, next.row)),
          column: Math.min(game.columns - 1, Math.max(0, next.column)),
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [bumpBoard, clearPendingValue, game, selected]);

  const explodeKeys = new Set(analysis?.explodeKeys ?? []);
  const flagKeys = new Set(analysis?.flagKeys ?? []);
  const pendingValueKeySet = new Set(pendingValueKeys);

  const flaggedCount = game ? game.getFlaggedCount() : 0;
  const selectedCell =
    game && selected ? game.cells[selected.row]?.[selected.column] : undefined;
  const isGameComplete = Boolean(
    game && flaggedCount > 0 && flaggedCount === game.mines,
  );

  useEffect(() => {
    if (!isGameComplete) {
      return;
    }
    toast.add({
      type: 'success',
      description: '插旗数量已满，本局可以结束了',
    });
  }, [isGameComplete]);

  return (
    <section className="flex flex-col gap-6 pb-48">
      <MinesweeperSetupComponent
        mode={mode}
        rows={rowsInput}
        columns={columnsInput}
        mines={minesInput}
        error={setupError}
        hasGame={Boolean(game)}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          setSetupError(null);
        }}
        onRowsChange={setRowsInput}
        onColumnsChange={setColumnsInput}
        onMinesChange={setMinesInput}
        onStart={handleStart}
        onReset={handleResetBoard}
      />

      {game ? (
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">
                已标 {flaggedCount} / {game.mines} 雷
              </p>
              <Field orientation="horizontal" className="w-fit">
                <Switch
                  id="enable-csp"
                  checked={enableCSP}
                  onCheckedChange={setEnableCSP}
                />
                <FieldLabel htmlFor="enable-csp">深度分析</FieldLabel>
              </Field>
              <Button type="button" onClick={() => void handleAnalyze()}>
                分析
              </Button>
              {selectedCell ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    selectedCell.getType() === MinesweeperCellType.EMPTY
                  }
                  onClick={handleResetSelectedCell}
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  重置 {selectedCell.getCellLabel()}
                </Button>
              ) : null}
            </div>
            {isGameComplete ? (
              <Alert>
                <CircleCheckIcon />
                <AlertTitle>游戏完成</AlertTitle>
                <AlertDescription>
                  插旗数量已经等于雷数，剩余未开格都可以视为安全格。
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="flex w-full justify-center">
              <MinesweeperBoardComponent
                game={game}
                selected={selected}
                explodeKeys={explodeKeys}
                flagKeys={flagKeys}
                pendingValueKeys={pendingValueKeySet}
                onLeftClick={handleLeftClick}
                onRightClick={handleRightClick}
              />
            </div>
          </div>
          <div className="w-full min-w-0 xl:max-w-sm">
            <MinesweeperAnalysisPanelComponent
              analysis={analysis}
              onCopy={(text) => void handleCopy(text)}
              onApplyExplode={handleApplyExplode}
              onApplyFlag={handleApplyFlag}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
