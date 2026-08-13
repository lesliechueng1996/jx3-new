import { Trash2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GuessRoundState } from '../-lib/idiom-guess-schema';
import GuessCellComponent from './GuessCellComponent';

type GuessRoundRowComponentProps = {
  round: GuessRoundState;
  index: number;
  onChange: (round: GuessRoundState) => void;
  onRemove: () => void;
};

const GuessRoundRowComponent = ({
  round,
  index,
  onChange,
  onRemove,
}: GuessRoundRowComponentProps) => {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">第 {index + 1} 轮</span>
          <span className="text-sm text-muted-foreground">{round.text}</span>
          <Badge variant={round.inDatabase ? 'secondary' : 'outline'}>
            {round.inDatabase ? '词库' : '自动拼音'}
          </Badge>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
          <Trash2Icon className="size-4" />
          <span className="sr-only">删除本轮</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {round.cells.map((cell) => (
          <GuessCellComponent
            key={`${round.id}-${cell.position}`}
            cell={cell}
            onChange={(nextCell) =>
              onChange({
                ...round,
                cells: round.cells.map((item) =>
                  item.position === nextCell.position ? nextCell : item,
                ),
              })
            }
          />
        ))}
      </div>
    </div>
  );
};

export default GuessRoundRowComponent;
