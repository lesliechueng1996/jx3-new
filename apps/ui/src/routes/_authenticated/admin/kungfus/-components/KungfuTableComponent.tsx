import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminKungfuListItem } from '@/lib/api/admin/admin-kungfus-api';
import {
  formatAttackSummary,
  kungfuTypeBadgeClassName,
  kungfuTypeLabel,
  kungfuUnlimitedBadgeClassName,
} from '../-lib/kungfus-helpers';

type KungfuTableComponentProps = {
  items: AdminKungfuListItem[];
  isLoading?: boolean;
  pendingKungfuId: string | null;
  onEdit: (kungfu: AdminKungfuListItem) => void;
  onDelete: (kungfu: AdminKungfuListItem) => void;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

export function KungfuTableComponent({
  items,
  isLoading = false,
  pendingKungfuId,
  onEdit,
  onDelete,
}: KungfuTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>门派</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>攻击属性</TableHead>
            <TableHead>无界</TableHead>
            <TableHead>别名</TableHead>
            <TableHead>图标</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="py-10 text-center text-muted-foreground"
              >
                暂无心法数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((kungfu) => (
              <TableRow key={kungfu.id}>
                <TableCell className="font-medium">{kungfu.name}</TableCell>
                <TableCell>{kungfu.schoolName}</TableCell>
                <TableCell>
                  <Badge
                    className={kungfuTypeBadgeClassName(kungfu.kungfuType)}
                  >
                    {kungfuTypeLabel(kungfu.kungfuType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {emptyValue(
                    formatAttackSummary(kungfu.attackType, kungfu.attackMethod),
                  )}
                </TableCell>
                <TableCell>
                  {kungfu.isUnlimited ? (
                    <Badge className={kungfuUnlimitedBadgeClassName}>
                      无界
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {emptyValue(
                    kungfu.alias.length > 0 ? kungfu.alias.join('、') : null,
                  )}
                </TableCell>
                <TableCell>
                  {kungfu.icon ? (
                    <img
                      src={kungfu.icon}
                      alt={`${kungfu.name}图标`}
                      className="size-8 rounded-md object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{kungfu.createdAt}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(kungfu)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingKungfuId === kungfu.id}
                      onClick={() => onDelete(kungfu)}
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
