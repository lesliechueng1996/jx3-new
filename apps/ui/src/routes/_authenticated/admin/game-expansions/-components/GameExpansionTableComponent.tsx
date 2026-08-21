import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
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
import type { AdminGameExpansionListItem } from '@/lib/api/admin/admin-game-expansions-api';
import { formatDateRange } from '../-lib/game-expansions-helpers';

type GameExpansionTableComponentProps = {
  items: AdminGameExpansionListItem[];
  isLoading?: boolean;
  pendingExpansionId: string | null;
  expandedExpansionId: string | null;
  onToggleExpand: (expansion: AdminGameExpansionListItem) => void;
  onEdit: (expansion: AdminGameExpansionListItem) => void;
  onDelete: (expansion: AdminGameExpansionListItem) => void;
  renderExpanded: (expansion: AdminGameExpansionListItem) => ReactNode;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

export function GameExpansionTableComponent({
  items,
  isLoading = false,
  pendingExpansionId,
  expandedExpansionId,
  onToggleExpand,
  onEdit,
  onDelete,
  renderExpanded,
}: GameExpansionTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <span className="sr-only">展开</span>
            </TableHead>
            <TableHead>名称</TableHead>
            <TableHead>等级</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>起止日期</TableHead>
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
                暂无资料片数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((expansion) => {
              const expanded = expandedExpansionId === expansion.id;
              return (
                <Fragment key={expansion.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-expanded={expanded}
                        aria-label={expanded ? '收起赛季' : '展开赛季'}
                        onClick={() => onToggleExpand(expansion)}
                      >
                        {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {expansion.name}
                    </TableCell>
                    <TableCell>{expansion.level}</TableCell>
                    <TableCell>{emptyValue(expansion.description)}</TableCell>
                    <TableCell>
                      {formatDateRange(expansion.startDate, expansion.endDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(expansion)}
                        >
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={pendingExpansionId === expansion.id}
                          onClick={() => onDelete(expansion)}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded ? (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30 p-4">
                        {renderExpanded(expansion)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
