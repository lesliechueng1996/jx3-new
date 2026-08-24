import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type RaidRunStatus, raidRunStatusMapping } from '../-lib/raid-run';

type Props = {
  status: RaidRunStatus;
  isDirty: boolean;
  isPending?: boolean;
  onSave: () => void;
  onPublish: () => void;
  onStart: () => void;
  onComplete: () => void;
  className?: string;
};

const leftSaveLabel = (status: RaidRunStatus) =>
  status === 'pending' ? '暂存' : '保存';

const RaidRunActionBarComponent = ({
  status,
  isDirty,
  isPending = false,
  onSave,
  onPublish,
  onStart,
  onComplete,
  className,
}: Props) => {
  const saveLabel = leftSaveLabel(status);

  return (
    <div
      className={cn(
        'flex w-full min-w-0 items-center justify-between gap-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onSave}
          >
            {saveLabel}
          </Button>
          {status === 'pending' ? (
            <Button type="button" disabled={isPending} onClick={onPublish}>
              发布开团
            </Button>
          ) : null}
        </div>
        {isDirty ? (
          <p className="text-muted-foreground text-sm">有未保存的修改</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="secondary">{raidRunStatusMapping[status]}</Badge>
        {status === 'recruiting' ? (
          <Button
            type="button"
            disabled={isDirty || isPending}
            onClick={onStart}
          >
            开始团本
          </Button>
        ) : null}
        {status === 'ongoing' ? (
          <Button
            type="button"
            disabled={isDirty || isPending}
            onClick={onComplete}
          >
            完成团本
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default RaidRunActionBarComponent;
