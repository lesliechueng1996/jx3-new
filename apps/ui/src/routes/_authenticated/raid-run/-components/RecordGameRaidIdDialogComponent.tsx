import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

type Props = {
  open: boolean;
  pending: boolean;
  initialGameRaidId?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (gameRaidId: string) => void;
};

export const RecordGameRaidIdDialogComponent = ({
  open,
  pending,
  initialGameRaidId,
  onOpenChange,
  onSubmit,
}: Props) => {
  const [gameRaidId, setGameRaidId] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) {
      return;
    }

    setGameRaidId(initialGameRaidId ?? '');
    setError(undefined);
  }, [open, initialGameRaidId]);

  const handleSubmit = () => {
    const trimmed = gameRaidId.trim();
    if (trimmed.length === 0) {
      setError('游戏副本ID不能为空');
      return;
    }

    if (trimmed.length > 64) {
      setError('游戏副本ID不能超过64个字符');
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>记录副本ID</DialogTitle>
          <DialogDescription>填写游戏内的副本ID。</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="raid-run-game-raid-id">游戏副本ID</FieldLabel>
            <Input
              id="raid-run-game-raid-id"
              value={gameRaidId}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setGameRaidId(event.target.value);
                setError(undefined);
              }}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
