import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RaidLootItem } from '@/lib/api/raid-loots-api';
import { formatGold } from '../-lib/gold';
import { formatRaidLootWinnerDisplay } from '../-lib/raid-loot';

type Props = {
  items: RaidLootItem[];
  pendingLootId?: string | null;
  onEdit: (item: RaidLootItem) => void;
  onDelete: (item: RaidLootItem) => void;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

export const RaidLootListComponent = ({
  items,
  pendingLootId,
  onEdit,
  onDelete,
}: Props) => {
  if (items.length === 0) {
    return <p className="text-muted-foreground">暂无掉落</p>;
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>物品</TableHead>
            <TableHead>数量</TableHead>
            <TableHead>获得者</TableHead>
            <TableHead>成交价格</TableHead>
            <TableHead>备注</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <span className="flex min-w-0 items-center gap-2">
                  {item.itemIcon ? (
                    <img
                      src={item.itemIcon}
                      alt={`${item.itemName}图标`}
                      className="size-8 rounded-md object-contain"
                    />
                  ) : null}
                  <span className="font-medium">{item.itemName}</span>
                </span>
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>
                {emptyValue(
                  formatRaidLootWinnerDisplay(
                    item.winnerCharacterName,
                    item.winnerServerName,
                  ) || null,
                )}
              </TableCell>
              <TableCell>
                {item.price === null ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  formatGold(item.price)
                )}
              </TableCell>
              <TableCell>{emptyValue(item.remark)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pendingLootId === item.id}
                    onClick={() => onEdit(item)}
                  >
                    编辑
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={pendingLootId === item.id}
                    onClick={() => onDelete(item)}
                  >
                    删除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
