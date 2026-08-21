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
import type { AdminGameExpansionFormValues } from '@/lib/api/admin/admin-game-expansions-api';
import type { ExpansionFormValues } from '../-lib/game-expansions-form-schema';
import {
  DEFAULT_EXPANSION_LEVEL,
  toOptionalDate,
  toOptionalText,
} from '../-lib/game-expansions-helpers';
import {
  type ExpansionFormFields,
  GameExpansionFormComponent,
} from './GameExpansionFormComponent';

type GameExpansionCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminGameExpansionFormValues) => void;
};

const emptyForm = (): ExpansionFormFields => ({
  name: '',
  level: String(DEFAULT_EXPANSION_LEVEL),
  description: '',
  startDate: '',
  endDate: '',
});

export function GameExpansionCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameExpansionCreateDialogComponentProps) {
  const handleSubmit = (values: ExpansionFormValues) => {
    onSubmit({
      name: values.name,
      level: Number(values.level),
      description: toOptionalText(values.description),
      startDate: values.startDate,
      endDate: toOptionalDate(values.endDate),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增资料片</DialogTitle>
          <DialogDescription>
            填写名称、等级与起始日期。终止日期可留空表示进行中。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <GameExpansionFormComponent
            formId="game-expansion-create-form"
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
            form="game-expansion-create-form"
            disabled={pending}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
