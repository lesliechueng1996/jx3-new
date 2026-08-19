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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AdminUserBanFormValues } from '@/lib/api/admin/admin-users-api';
import {
  BAN_DURATION_VALUES,
  type BanDuration,
  banDurationToSeconds,
  banUserFormSchema,
} from '../-lib/users-form-schema';

type UserBanDialogComponentProps = {
  open: boolean;
  pending: boolean;
  userName?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminUserBanFormValues) => void;
};

const durationLabels: Record<BanDuration, string> = {
  permanent: '永久',
  '1d': '1 天',
  '7d': '7 天',
  '30d': '30 天',
};

export function UserBanDialogComponent({
  open,
  pending,
  userName,
  onOpenChange,
  onSubmit,
}: UserBanDialogComponentProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<BanDuration>('permanent');
  const [reasonError, setReasonError] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setReason('');
      setDuration('permanent');
      setReasonError(undefined);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = banUserFormSchema.safeParse({ reason, duration });
    if (!result.success) {
      const issue = result.error.issues[0];
      setReasonError(issue?.message);
      return;
    }

    setReasonError(undefined);
    onSubmit({
      reason: result.data.reason,
      banExpiresIn: banDurationToSeconds(result.data.duration),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>封禁用户</DialogTitle>
          <DialogDescription>
            {userName
              ? `封禁「${userName}」后对方将无法登录，已有会话会被撤销。`
              : '封禁后对方将无法登录，已有会话会被撤销。'}
          </DialogDescription>
        </DialogHeader>
        <form
          id="user-ban-form"
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <FieldGroup>
            <Field data-invalid={Boolean(reasonError) || undefined}>
              <FieldLabel htmlFor="user-ban-reason">原因</FieldLabel>
              <Textarea
                id="user-ban-reason"
                value={reason}
                placeholder="请填写封禁原因"
                aria-invalid={Boolean(reasonError)}
                disabled={pending}
                onChange={(event) => setReason(event.target.value)}
              />
              {reasonError ? <FieldError>{reasonError}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel>时长</FieldLabel>
              <ToggleGroup
                variant="outline"
                spacing={0}
                value={[duration]}
                disabled={pending}
                onValueChange={(value) => {
                  const next = value[0];
                  if (
                    next === 'permanent' ||
                    next === '1d' ||
                    next === '7d' ||
                    next === '30d'
                  ) {
                    setDuration(next);
                  }
                }}
              >
                {BAN_DURATION_VALUES.map((value) => (
                  <ToggleGroupItem key={value} value={value}>
                    {durationLabels[value]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </FieldGroup>
        </form>
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
            form="user-ban-form"
            variant="destructive"
            disabled={pending}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            封禁
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
