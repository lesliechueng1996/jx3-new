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
  AdminGameExpansionFormValues,
  AdminGameExpansionListItem,
} from '@/lib/api/admin/admin-game-expansions-api';
import type { ExpansionFormValues } from '../-lib/game-expansions-form-schema';
import {
  toOptionalDate,
  toOptionalText,
} from '../-lib/game-expansions-helpers';
import { GameExpansionFormComponent } from './GameExpansionFormComponent';

type GameExpansionEditDialogComponentProps = {
  expansion: AdminGameExpansionListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminGameExpansionFormValues) => void;
};

export function GameExpansionEditDialogComponent({
  expansion,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameExpansionEditDialogComponentProps) {
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
          <DialogTitle>编辑资料片</DialogTitle>
          <DialogDescription>
            修改名称、等级、描述或起止日期。
          </DialogDescription>
        </DialogHeader>
        {open && expansion ? (
          <GameExpansionFormComponent
            key={expansion.id}
            formId="game-expansion-edit-form"
            initialValues={{
              name: expansion.name,
              level: String(expansion.level),
              description: expansion.description ?? '',
              startDate: expansion.startDate,
              endDate: expansion.endDate ?? '',
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
            form="game-expansion-edit-form"
            disabled={pending || !expansion}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
