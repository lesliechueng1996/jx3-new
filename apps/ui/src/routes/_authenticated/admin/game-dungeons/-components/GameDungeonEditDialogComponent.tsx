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
  AdminGameDungeonFormValues,
  AdminGameDungeonListItem,
} from '@/lib/api/admin/admin-game-dungeons-api';
import type { GameDungeonFormValues } from '../-lib/game-dungeons-form-schema';
import { toAdminGameDungeonFormValues } from '../-lib/game-dungeons-helpers';
import { GameDungeonFormComponent } from './GameDungeonFormComponent';

type GameDungeonEditDialogComponentProps = {
  dungeon: AdminGameDungeonListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminGameDungeonFormValues) => void;
};

export function GameDungeonEditDialogComponent({
  dungeon,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameDungeonEditDialogComponentProps) {
  const handleSubmit = (values: GameDungeonFormValues) => {
    onSubmit(toAdminGameDungeonFormValues(values));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑副本</DialogTitle>
          <DialogDescription>修改副本信息与刷新日。</DialogDescription>
        </DialogHeader>
        {open && dungeon ? (
          <GameDungeonFormComponent
            key={dungeon.id}
            formId="game-dungeon-edit-form"
            initialValues={{
              name: dungeon.name,
              expansionId: dungeon.expansionId,
              seasonId: dungeon.seasonId,
              playerLimit: String(dungeon.playerLimit),
              difficulty: dungeon.difficulty,
              levelRequirement: String(dungeon.levelRequirement),
              bossCount: String(dungeon.bossCount),
              resetWeekdays: dungeon.resetWeekdays,
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
            form="game-dungeon-edit-form"
            disabled={pending || !dungeon}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
