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
import type { AdminGameSeasonFormValues } from '@/lib/api/admin/admin-game-seasons-api';
import {
  toOptionalDate,
  toOptionalText,
} from '../-lib/game-expansions-helpers';
import type { SeasonFormValues } from '../-lib/game-seasons-form-schema';
import {
  GameSeasonFormComponent,
  type SeasonFormFields,
} from './GameSeasonFormComponent';

type GameSeasonCreateDialogComponentProps = {
  expansionId: string | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminGameSeasonFormValues) => void;
};

const emptyForm = (): SeasonFormFields => ({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  sortOrder: '0',
});

export function GameSeasonCreateDialogComponent({
  expansionId,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameSeasonCreateDialogComponentProps) {
  const handleSubmit = (values: SeasonFormValues) => {
    if (!expansionId) {
      return;
    }

    onSubmit({
      expansionId,
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
          <DialogTitle>新增赛季</DialogTitle>
          <DialogDescription>
            赛季日期必须落在所属资料片的日期范围内。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <GameSeasonFormComponent
            formId="game-season-create-form"
            initialValues={emptyForm()}
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
            form="game-season-create-form"
            disabled={pending || !expansionId}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
