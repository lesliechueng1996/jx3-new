import { cn } from '@/lib/utils';
import type {
  GuessCellColor,
  GuessCellState,
} from '../-lib/idiom-guess-schema';

type GuessCellComponentProps = {
  cell: GuessCellState;
  onChange: (cell: GuessCellState) => void;
};

const cellColorClass = (color: GuessCellColor): string => {
  switch (color) {
    case 'orange':
      return 'text-orange-500';
    case 'green':
      return 'text-emerald-600';
    default:
      return 'text-muted-foreground/40';
  }
};

const cycleCellColor = (color: GuessCellColor): GuessCellColor => {
  if (color === 'black') {
    return 'orange';
  }
  if (color === 'orange') {
    return 'green';
  }
  return 'black';
};

const syllableLinkClass = (link: GuessCellColor): string => {
  switch (link) {
    case 'orange':
      return 'bg-orange-500';
    case 'green':
      return 'bg-emerald-600';
    default:
      return 'bg-muted-foreground/40';
  }
};

const GuessCellComponent = ({ cell, onChange }: GuessCellComponentProps) => {
  return (
    <div className="flex min-w-26 flex-col items-center gap-1.5 rounded-md bg-muted px-2 py-2.5">
      <div className="flex items-center gap-1.5 text-sm">
        <button
          type="button"
          className={cn(
            'inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-1.5 font-mono transition-colors hover:bg-background/60 active:bg-background/80',
            cellColorClass(cell.initialColor),
          )}
          onClick={() =>
            onChange({
              ...cell,
              initialColor: cycleCellColor(cell.initialColor),
            })
          }
        >
          {cell.initial || '∅'}
        </button>
        <button
          type="button"
          className={cn(
            'inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-1.5 font-mono transition-colors hover:bg-background/60 active:bg-background/80',
            cellColorClass(cell.finalColor),
          )}
          onClick={() =>
            onChange({
              ...cell,
              finalColor: cycleCellColor(cell.finalColor),
            })
          }
        >
          {cell.final}
        </button>
        <button
          type="button"
          className={cn(
            'inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-1.5 font-mono transition-colors hover:bg-background/60 active:bg-background/80',
            cellColorClass(cell.toneColor),
          )}
          onClick={() =>
            onChange({
              ...cell,
              toneColor: cycleCellColor(cell.toneColor),
            })
          }
        >
          {cell.tone}
        </button>
      </div>

      <button
        type="button"
        aria-label="切换音节关联线"
        className="flex h-8 w-full items-center justify-center rounded-md transition-colors hover:bg-background/60 active:bg-background/80"
        onClick={() =>
          onChange({
            ...cell,
            syllableLink: cycleCellColor(cell.syllableLink),
          })
        }
      >
        <span
          className={cn(
            'h-1 w-full max-w-14 rounded-full',
            syllableLinkClass(cell.syllableLink),
          )}
        />
      </button>

      <button
        type="button"
        className={cn(
          'min-h-10 min-w-10 text-xl font-semibold leading-none transition-colors',
          cellColorClass(cell.charColor),
        )}
        onClick={() =>
          onChange({
            ...cell,
            charColor: cycleCellColor(cell.charColor),
          })
        }
      >
        {cell.char}
      </button>
    </div>
  );
};

export default GuessCellComponent;
