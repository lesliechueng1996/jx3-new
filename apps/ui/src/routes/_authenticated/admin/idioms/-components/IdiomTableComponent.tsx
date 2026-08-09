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
import type { AdminIdiomListItem } from '@/lib/api/admin/admin-idioms-api';

type IdiomTableComponentProps = {
  items: AdminIdiomListItem[];
  isLoading?: boolean;
  pendingIdiomId: string | null;
  onEdit: (idiom: AdminIdiomListItem) => void;
  onDelete: (idiom: AdminIdiomListItem) => void;
};

export function IdiomTableComponent({
  items,
  isLoading = false,
  pendingIdiomId,
  onEdit,
  onDelete,
}: IdiomTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>成语</TableHead>
            <TableHead>拼音</TableHead>
            <TableHead>声调模式</TableHead>
            <TableHead>释义</TableHead>
            <TableHead>字数</TableHead>
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
                暂无成语数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((idiom) => (
              <TableRow key={idiom.id}>
                <TableCell className="font-medium">{idiom.text}</TableCell>
                <TableCell>{idiom.pinyin}</TableCell>
                <TableCell>{idiom.tonePattern}</TableCell>
                <TableCell>
                  {idiom.meaning ?? (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{idiom.charCount}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(idiom)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingIdiomId === idiom.id}
                      onClick={() => onDelete(idiom)}
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
