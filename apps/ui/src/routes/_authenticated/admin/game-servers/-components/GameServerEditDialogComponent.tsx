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
  AdminGameServerFormValues,
  AdminGameServerListItem,
} from '@/lib/api/admin/admin-game-servers-api';
import type { GameServerFormValues } from '../-lib/game-servers-form-schema';
import {
  formatAliasInput,
  parseAliasInput,
} from '../-lib/game-servers-helpers';
import { GameServerFormComponent } from './GameServerFormComponent';

type GameServerEditDialogComponentProps = {
  gameServer: AdminGameServerListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminGameServerFormValues) => void;
};

export function GameServerEditDialogComponent({
  gameServer,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameServerEditDialogComponentProps) {
  const handleSubmit = (values: GameServerFormValues) => {
    onSubmit({
      serverId: values.serverId,
      zone: values.zone,
      name: values.name,
      alias: parseAliasInput(values.aliasText),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑区服</DialogTitle>
          <DialogDescription>
            修改服务器 ID、大区、名称或别名。
          </DialogDescription>
        </DialogHeader>
        {open && gameServer ? (
          <GameServerFormComponent
            key={gameServer.id}
            formId="game-server-edit-form"
            initialValues={{
              serverId: gameServer.serverId,
              zone: gameServer.zone,
              name: gameServer.name,
              aliasText: formatAliasInput(gameServer.alias),
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
            form="game-server-edit-form"
            disabled={pending || !gameServer}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
