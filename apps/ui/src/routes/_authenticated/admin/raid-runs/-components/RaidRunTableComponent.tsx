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
import type { AdminRaidRunListItem } from '@/lib/api/admin/admin-raid-runs-api';
import {
  formatReservedSlots,
  raidRunStatusBadgeClassName,
  raidRunStatusLabel,
  weekdayFromStartTime,
} from '../-lib/raid-runs-helpers';

type RaidRunTableComponentProps = {
  items: AdminRaidRunListItem[];
  isLoading?: boolean;
  pendingRaidRunId: string | null;
  onEdit: (raidRun: AdminRaidRunListItem) => void;
  onCopy: (raidRun: AdminRaidRunListItem) => void;
  onDelete: (raidRun: AdminRaidRunListItem) => void;
};

const emptyValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? (
    <span className="text-muted-foreground">-</span>
  ) : (
    value
  );

const COLUMN_COUNT = 13;

export function RaidRunTableComponent({
  items,
  isLoading = false,
  pendingRaidRunId,
  onEdit,
  onCopy,
  onDelete,
}: RaidRunTableComponentProps) {
  return (
    <div className="relative overflow-x-auto rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>副本</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>游戏开团 ID</TableHead>
            <TableHead>开团时间</TableHead>
            <TableHead>星期</TableHead>
            <TableHead>结束时间</TableHead>
            <TableHead>预留</TableHead>
            <TableHead>报名数</TableHead>
            <TableHead>金团总计</TableHead>
            <TableHead>每人工资</TableHead>
            <TableHead>补贴</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="py-10 text-center text-muted-foreground"
              >
                暂无开团数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((raidRun) => (
              <TableRow key={raidRun.id}>
                <TableCell className="font-medium">{raidRun.name}</TableCell>
                <TableCell>{emptyValue(raidRun.dungeonName)}</TableCell>
                <TableCell>
                  <Badge
                    className={raidRunStatusBadgeClassName(raidRun.status)}
                  >
                    {raidRunStatusLabel(raidRun.status)}
                  </Badge>
                </TableCell>
                <TableCell>{emptyValue(raidRun.gameRaidId)}</TableCell>
                <TableCell>{raidRun.startTime}</TableCell>
                <TableCell>{weekdayFromStartTime(raidRun.startTime)}</TableCell>
                <TableCell>{emptyValue(raidRun.endTime)}</TableCell>
                <TableCell>
                  {emptyValue(formatReservedSlots(raidRun))}
                </TableCell>
                <TableCell>{raidRun.signupCount}</TableCell>
                <TableCell>{raidRun.totalIncome}</TableCell>
                <TableCell>{raidRun.wagePerPerson}</TableCell>
                <TableCell>{raidRun.subsidyAmount}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(raidRun)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingRaidRunId === raidRun.id}
                      onClick={() => onCopy(raidRun)}
                    >
                      复制
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingRaidRunId === raidRun.id}
                      onClick={() => onDelete(raidRun)}
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
