import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminGameServerListItem } from '@/lib/api/admin/admin-game-servers-api';

type GameServerTableComponentProps = {
  items: AdminGameServerListItem[];
  isLoading?: boolean;
  pendingGameServerId: string | null;
  onEdit: (gameServer: AdminGameServerListItem) => void;
  onDelete: (gameServer: AdminGameServerListItem) => void;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

export function GameServerTableComponent({
  items,
  isLoading = false,
  pendingGameServerId,
  onEdit,
  onDelete,
}: GameServerTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>大区</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>服务器 ID</TableHead>
            <TableHead>别名</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-muted-foreground"
              >
                暂无区服数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((gameServer) => (
              <TableRow key={gameServer.id}>
                <TableCell>{gameServer.zone}</TableCell>
                <TableCell className="font-medium">{gameServer.name}</TableCell>
                <TableCell>{gameServer.serverId}</TableCell>
                <TableCell>
                  {emptyValue(
                    gameServer.alias.length > 0
                      ? gameServer.alias.join('、')
                      : null,
                  )}
                </TableCell>
                <TableCell>{gameServer.createdAt}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(gameServer)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingGameServerId === gameServer.id}
                      onClick={() => onDelete(gameServer)}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
