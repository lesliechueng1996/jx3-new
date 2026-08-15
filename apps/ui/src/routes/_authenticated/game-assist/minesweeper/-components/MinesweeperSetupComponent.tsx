import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  CHALLENGE_CONFIG,
  type DifficultyMode,
  MAX_COLUMNS,
  MAX_MINES,
  MAX_ROWS,
} from '../-lib/minesweeper-setup';

type MinesweeperSetupComponentProps = {
  mode: DifficultyMode;
  rows: string;
  columns: string;
  mines: string;
  error: string | null;
  hasGame: boolean;
  onModeChange: (mode: DifficultyMode) => void;
  onRowsChange: (value: string) => void;
  onColumnsChange: (value: string) => void;
  onMinesChange: (value: string) => void;
  onStart: () => void;
  onReset: () => void;
};

const MinesweeperSetupComponent = ({
  mode,
  rows,
  columns,
  mines,
  error,
  hasGame,
  onModeChange,
  onRowsChange,
  onColumnsChange,
  onMinesChange,
  onStart,
  onReset,
}: MinesweeperSetupComponentProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-end gap-4">
        <Field className="w-fit">
          <FieldLabel>难度</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
            value={[mode]}
            onValueChange={(value) => {
              const nextMode = value[0];
              if (nextMode === 'challenge' || nextMode === 'custom') {
                onModeChange(nextMode);
              }
            }}
          >
            <ToggleGroupItem value="challenge">挑战</ToggleGroupItem>
            <ToggleGroupItem value="custom">自定义</ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {mode === 'challenge' ? (
          <p className="text-sm text-muted-foreground">
            {CHALLENGE_CONFIG.rows} 行 × {CHALLENGE_CONFIG.columns} 列，
            {CHALLENGE_CONFIG.mines} 雷
          </p>
        ) : (
          <FieldGroup className="flex-row flex-wrap gap-3">
            <Field className="w-24">
              <FieldLabel htmlFor="minesweeper-rows">行数</FieldLabel>
              <Input
                id="minesweeper-rows"
                inputMode="numeric"
                min={1}
                max={MAX_ROWS}
                value={rows}
                aria-invalid={Boolean(error)}
                onChange={(event) => onRowsChange(event.target.value)}
              />
            </Field>
            <Field className="w-24">
              <FieldLabel htmlFor="minesweeper-columns">列数</FieldLabel>
              <Input
                id="minesweeper-columns"
                inputMode="numeric"
                min={1}
                max={MAX_COLUMNS}
                value={columns}
                aria-invalid={Boolean(error)}
                onChange={(event) => onColumnsChange(event.target.value)}
              />
            </Field>
            <Field className="w-24">
              <FieldLabel htmlFor="minesweeper-mines">雷数</FieldLabel>
              <Input
                id="minesweeper-mines"
                inputMode="numeric"
                min={1}
                max={MAX_MINES}
                value={mines}
                aria-invalid={Boolean(error)}
                onChange={(event) => onMinesChange(event.target.value)}
              />
            </Field>
          </FieldGroup>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onStart}>
            {hasGame ? '重新开局' : '开始游戏'}
          </Button>
          {hasGame ? (
            <Button type="button" variant="outline" onClick={onReset}>
              清空棋盘
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
};

export default MinesweeperSetupComponent;
