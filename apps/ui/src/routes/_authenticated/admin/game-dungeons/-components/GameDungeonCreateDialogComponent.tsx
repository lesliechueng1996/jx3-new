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
import type { AdminGameDungeonFormValues } from '@/lib/api/admin/admin-game-dungeons-api';
import type { GameDungeonFormValues } from '../-lib/game-dungeons-form-schema';
import { toAdminGameDungeonFormValues } from '../-lib/game-dungeons-helpers';
import {
  GameDungeonFormComponent,
  type GameDungeonFormFields,
} from './GameDungeonFormComponent';

type GameDungeonCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminGameDungeonFormValues) => void;
};

const emptyForm = (): GameDungeonFormFields => ({
  name: '',
  expansionId: '',
  seasonId: '',
  playerLimit: '',
  difficulty: 'normal',
  levelRequirement: '',
  bossCount: '',
  resetWeekdays: [],
});

export function GameDungeonCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameDungeonCreateDialogComponentProps) {
  const handleSubmit = (values: GameDungeonFormValues) => {
    onSubmit(toAdminGameDungeonFormValues(values));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>新增副本</DialogTitle>
          <DialogDescription>
            先选择资料片再选择赛季。刷新日可多选，空表示无每周 CD。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <GameDungeonFormComponent
            formId="game-dungeon-create-form"
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
            form="game-dungeon-create-form"
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
