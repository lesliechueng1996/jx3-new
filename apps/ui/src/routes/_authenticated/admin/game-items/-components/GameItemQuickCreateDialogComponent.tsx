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
import type { GameItemQuickCreateValues } from '@/routes/_authenticated/-components/GameItemQuickCreateFormComponent';
import { GameItemQuickCreateFormComponent } from '@/routes/_authenticated/-components/GameItemQuickCreateFormComponent';

type GameItemQuickCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GameItemQuickCreateValues) => void;
};

export function GameItemQuickCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameItemQuickCreateDialogComponentProps) {
  const handleSubmit = (values: GameItemQuickCreateValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>快速添加物品</DialogTitle>
          <DialogDescription>
            填写名称、类型与品质，将自动匹配图标与描述。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <GameItemQuickCreateFormComponent
            formId="game-item-quick-create-form"
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
            form="game-item-quick-create-form"
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
