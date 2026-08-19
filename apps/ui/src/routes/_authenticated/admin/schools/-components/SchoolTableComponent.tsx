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
import type { AdminSchoolListItem } from '@/lib/api/admin/admin-schools-api';
import { schoolTypeLabel } from '../-lib/schools-helpers';

type SchoolTableComponentProps = {
  items: AdminSchoolListItem[];
  isLoading?: boolean;
  pendingSchoolId: string | null;
  onEdit: (school: AdminSchoolListItem) => void;
  onDelete: (school: AdminSchoolListItem) => void;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

export function SchoolTableComponent({
  items,
  isLoading = false,
  pendingSchoolId,
  onEdit,
  onDelete,
}: SchoolTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>类型</TableHead>
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
                colSpan={6}
                className="py-10 text-center text-muted-foreground"
              >
                暂无门派数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={school.type === 'school' ? 'default' : 'secondary'}
                  >
                    {schoolTypeLabel(school.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {emptyValue(
                    school.alias.length > 0 ? school.alias.join('、') : null,
                  )}
                </TableCell>
                <TableCell>
                  {school.icon ? (
                    <img
                      src={school.icon}
                      alt={`${school.name}图标`}
                      className="size-8 rounded-md object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{school.createdAt}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(school)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingSchoolId === school.id}
                      onClick={() => onDelete(school)}
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
