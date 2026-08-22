import { useEffect, useState } from 'react';
import { GameItemSearchSelectComponent } from '@/components/GameItemSearchSelectComponent';
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
import type { AdminGameItemListItem } from '@/lib/api/admin/admin-game-items-api';

type GameItemReplaceDialogComponentProps = {
  item: AdminGameItemListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (targetItemId: string) => void;
};

export function GameItemReplaceDialogComponent({
  item,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: GameItemReplaceDialogComponentProps) {
  const [targetItemId, setTargetItemId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setTargetItemId(undefined);
      setError(undefined);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!targetItemId) {
      setError('请选择要替换的物品');
      return;
    }
    onConfirm(targetItemId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>替换物品</DialogTitle>
          <DialogDescription>
            {item
              ? `将掉落记录中的「${item.name}」替换为正确物品。此操作不会删除原物品。`
              : '选择要替换成的正确物品。'}
          </DialogDescription>
        </DialogHeader>
        {open && item ? (
          <GameItemSearchSelectComponent
            id="game-item-replace-target"
            excludeId={item.id}
            value={targetItemId}
            disabled={pending}
            error={error}
            onValueChange={(next) => {
              setTargetItemId(next);
              setError(undefined);
            }}
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
            type="button"
            disabled={pending || !item}
            onClick={handleConfirm}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            确认替换
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
