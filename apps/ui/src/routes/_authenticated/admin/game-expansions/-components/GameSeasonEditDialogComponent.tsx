import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type {
  AdminGameSeasonFormValues,
  AdminGameSeasonListItem,
} from '@/lib/api/admin/admin-game-seasons-api';
import {
  toOptionalDate,
  toOptionalText,
} from '../-lib/game-expansions-helpers';
import type { SeasonFormValues } from '../-lib/game-seasons-form-schema';
import { GameSeasonFormComponent } from './GameSeasonFormComponent';

type GameSeasonEditDialogComponentProps = {
  season: AdminGameSeasonListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Omit<AdminGameSeasonFormValues, 'expansionId'>) => void;
};

export function GameSeasonEditDialogComponent({
  season,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameSeasonEditDialogComponentProps) {
  const handleSubmit = (values: SeasonFormValues) => {
    onSubmit({
      name: values.name,
      description: toOptionalText(values.description),
      startDate: values.startDate,
      endDate: toOptionalDate(values.endDate),
      sortOrder: Number(values.sortOrder),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑赛季</DialogTitle>
          <DialogDescription>
            赛季日期必须落在所属资料片的日期范围内。
          </DialogDescription>
        </DialogHeader>
        {open && season ? (
          <GameSeasonFormComponent
            key={season.id}
            formId="game-season-edit-form"
            initialValues={{
              name: season.name,
              description: season.description ?? '',
              startDate: season.startDate,
              endDate: season.endDate ?? '',
              sortOrder: String(season.sortOrder),
            }}
            pending={pending}
            onSubmit={handleSubmit}
          />
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="submit"
            form="game-season-edit-form"
            disabled={pending || !season}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
